import React, { useState, useRef, useEffect } from 'react';
// import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';
import './avatar.css';

function Avatar() {
  const heygen_API = {
    apiKey: 'NmU2OWRmODU5YTE0NDRkZGI0MjQwMGExZjZhZjA5MjEtMTc1MDY5NDU2MA==',
    serverUrl: 'https://api.heygen.com',
  };

  const [status, setStatus] = useState('Please click the new button to create the stream first.');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [mediaCanPlay, setMediaCanPlay] = useState(false);
  const [renderID, setRenderID] = useState(0);

  const mediaElementRef = useRef(null);
  const canvasElementRef = useRef(null);
  const bgInputRef = useRef(null);
  const removeBGCheckboxRef = useRef(null);
  const statusContainerRef = useRef(null);

  const updateStatus = (message) => {
    setStatus((prevStatus) => `${prevStatus} \n ${message}\n`);
  };

  const createNewSession = async () => {
    updateStatus('Creating new session... please wait');

    const avatar = 'Marianne_ProfessionalLook2_public';
    const voice = document.querySelector('#voiceID').value;

    const sessionData = await newSession('low', avatar, voice);
    const { sdp: serverSdp, ice_servers2: iceServers } = sessionData;

    const connection = new RTCPeerConnection({ iceServers });

    connection.ontrack = (event) => {
      if (event.track.kind === 'audio' || event.track.kind === 'video') {
        mediaElementRef.current.srcObject = event.streams[0];
      }
    };

    connection.ondatachannel = (event) => {
      const dataChannel = event.channel;
      dataChannel.onmessage = (e) => console.log('Received message:', e.data);
    };

    const remoteDescription = new RTCSessionDescription(serverSdp);
    await connection.setRemoteDescription(remoteDescription);

    setPeerConnection(connection);
    setSessionInfo(sessionData);

    updateStatus('Session creation completed');
    updateStatus('Now you can click the start button to start the stream');
  };

  const startAndDisplaySession = async () => {
    if (!sessionInfo) {
      updateStatus('Please create a connection first');
      return;
    }

    updateStatus('Starting session... please wait');

    const localDescription = await peerConnection.createAnswer();
    await peerConnection.setLocalDescription(localDescription);

    peerConnection.onicecandidate = ({ candidate }) => {
      if (candidate) {
        handleICE(sessionInfo.session_id, candidate.toJSON());
      }
    };

    peerConnection.oniceconnectionstatechange = () => {
      updateStatus(`ICE connection state changed to: ${peerConnection.iceConnectionState}`);
    };

    await startSession(sessionInfo.session_id, localDescription);

    peerConnection.getReceivers().forEach((receiver) => {
      receiver.jitterBufferTarget = 500;
    });

    updateStatus('Session started successfully');
  };

  const closeConnectionHandler = async () => {
    if (!sessionInfo) {
      updateStatus('Please create a connection first');
      return;
    }

    setRenderID((prevID) => prevID + 1);
    setMediaCanPlay(false);

    updateStatus('Closing connection... please wait');

    try {
      peerConnection.close();
      await stopSession(sessionInfo.session_id);
    } catch (err) {
      console.error('Failed to close the connection:', err);
    }

    updateStatus('Connection closed successfully');
  };

  const renderCanvas = () => {
    if (!removeBGCheckboxRef.current.checked) return;

    const canvas = canvasElementRef.current;
    const mediaElement = mediaElementRef.current;

    canvas.classList.add('show');

    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Update the background to use an image from the public/backgrounds folder
    const backgroundImagePath = '/backgrounds/Office_Background.gif';
    canvas.parentElement.style.background = `url('${backgroundImagePath}') center / cover no-repeat`;

    const processFrame = () => {
      if (!removeBGCheckboxRef.current.checked) return;

      canvas.width = mediaElement.videoWidth;
      canvas.height = mediaElement.videoHeight;

      ctx.drawImage(mediaElement, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        // Remove green screen pixels
        if (green > 90 && red < 90 && blue < 90) {
          data[i + 3] = 0;
        }
      }

      ctx.putImageData(imageData, 0, 0);

      requestAnimationFrame(processFrame);
    };

    processFrame();
  };

  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    mediaElement.onloadedmetadata = () => {
      setMediaCanPlay(true);
      mediaElement.play();
    };
  }, []);

  useEffect(() => {
    if (statusContainerRef.current) {
      statusContainerRef.current.scrollTop = statusContainerRef.current.scrollHeight;
    }
  }, [status]);

  const handleRepeatClick = () => {
    const taskInput = document.querySelector('#taskInput').value; // Get the input value

    // Validate and sanitize the input
    if (!taskInput.trim()) {
      updateStatus('Please enter a valid message to repeat.');
      return;
    }

    repeat(sessionInfo.session_id, taskInput.trim())
      .then(() => updateStatus('Repeat task executed successfully'))
      .catch((error) => console.error('Repeat task failed:', error));
  };

  return (
    <div className="Avatar-component">
      <div className="main">
        <div className="actionRowsWrap">
          {/* Action buttons */}
          <div className="actionRow">
            <label>
              AvatarID
              <input id="avatarID" type="text" />
            </label>
            <label>
              VoiceID
              <input id="voiceID" type="text" />
            </label>
            <button id="newBtn" onClick={createNewSession}>New</button>
            <button id="startBtn" onClick={startAndDisplaySession}>Start</button>
            <button id="closeBtn" onClick={closeConnectionHandler}>Close</button>
          </div>
          <div className="actionRow">
            <label>
              Message
              <input id="taskInput" type="text" />
            </label>
            <button id="repeatBtn" onClick={handleRepeatClick}>Repeat</button>
          </div>
        </div>

        {/* Scrollable status container with autoscroll */}
        <div id="status-container" ref={statusContainerRef} style={{
          maxHeight: '150px',
          overflowY: 'auto',
          border: '1px solid #ccc',
          padding: '10px',
          backgroundColor: '#f9f9f9',
          whiteSpace: 'pre-wrap',
        }}>
          {status}
        </div>

        {/* Video section */}
        <div className="videoSectionWrap">
          <div className="videoWrap">
            <video ref={mediaElementRef} className="videoEle show" autoPlay></video>
            <canvas ref={canvasElementRef} className="videoEle hide"></canvas>
          </div>
          <div className="actionRow switchRow hide" id="bgCheckboxWrap">
            <div className="switchWrap">
              <span>Remove background</span>
              <label className="switch">
                <input type="checkbox" ref={removeBGCheckboxRef} />
                <span className="slider round"></span>
              </label>
            </div>
            <label>
              Background (CSS)
              <input
                type="text"
                ref={bgInputRef}
                defaultValue='url("https://app.heygen.com/icons/heygen/logo_hori_text_light_bg.svg") center / contain no-repeat'
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  async function newSession(quality, avatar_name, voice_id) {
    try {
      console.log('Sending request to create new session:', {
        quality,
        avatar_name,
        voice: {
          voice_id,
        },
      });

      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify({
          quality,
          avatar_name,
          voice: {
            voice_id,
          },
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error:', response.statusText, 'Details:', errorText);
        updateStatus('Server Error. Please ask the staff if the service has been turned on');
        throw new Error('Server error');
      }

      const data = await response.json();

      if (!data || !data.data) {
        console.error('Invalid response structure:', data);
        updateStatus('Invalid response from server. Please check the API.');
        throw new Error('Invalid response structure');
      }

      console.log('Session data received:', data.data);
      return data.data;
    } catch (error) {
      console.error('Error in newSession:', error);
      updateStatus('Error creating new session. Please try again later.');
      throw error;
    }
  }

  async function startSession(session_id, sdp) {
    const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': heygen_API.apiKey,
      },
      body: JSON.stringify({ session_id, sdp }),
    });
    if (response.status === 500) {
      console.error('Server error');
      updateStatus('Server Error. Please ask the staff if the service has been turned on');
      throw new Error('Server error');
    } else {
      const data = await response.json();
      return data.data;
    }
  }

  async function handleICE(session_id, candidate) {
    const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.ice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': heygen_API.apiKey,
      },
      body: JSON.stringify({ session_id, candidate }),
    });
    if (response.status === 500) {
      console.error('Server error');
      updateStatus('Server Error. Please ask the staff if the service has been turned on');
      throw new Error('Server error');
    } else {
      const data = await response.json();
      return data;
    }
  }

  async function repeat(session_id, text) {
    try {
      // Validate that `text` is a string
      if (typeof text !== 'string') {
        throw new Error('Invalid text input. Expected a string.');
      }

      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.task`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify({ session_id, text }),
      });

      if (!response.ok) {
        console.error('Server error:', response.statusText);
        updateStatus('Server Error. Please ask the staff if the service has been turned on');
        throw new Error('Server error');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in repeat:', error);
      updateStatus('Error executing repeat task. Please try again later.');
      throw error;
    }
  }

  async function stopSession(session_id) {
    const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.stop`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': heygen_API.apiKey,
      },
      body: JSON.stringify({ session_id }),
    });
    if (response.status === 500) {
      console.error('Server error');
      updateStatus('Server Error. Please ask the staff for help');
      throw new Error('Server error');
    } else {
      const data = await response.json();
      return data.data;
    }
  }
}

export default Avatar;