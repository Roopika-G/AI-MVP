import React, { useState, useRef, useEffect } from 'react';
// import StreamingAvatar, { AvatarQuality, StreamingEvents } from '@heygen/streaming-avatar';
import './avatar.css';
import './avatar-status.css';

function Avatar({ isActive = false, textToSpeak = '' }) {
  const heygen_API = {
    apiKey: 'ZWE4YzU5YWQ0NjQ1NDYyZWFmZmEwMWZlMzY1OGY0M2MtMTc1MTMzMTU2Ng==',
    serverUrl: 'https://api.heygen.com',
  };

  const [status, setStatus] = useState('Initializing avatar...');
  const [sessionInfo, setSessionInfo] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [mediaCanPlay, setMediaCanPlay] = useState(false);
  const [renderID, setRenderID] = useState(0);
  const [initializationFailed, setInitializationFailed] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const mediaElementRef = useRef(null);

  const updateStatus = (message) => {
    console.log(`Avatar status: ${message}`);
    setStatus((prevStatus) => `${prevStatus} \n ${message}\n`);
  };

  // Effect for handling session lifecycle based on isActive prop
  useEffect(() => {
    let isMounted = true;
    
    const setupSession = async () => {
      // Check if we should attempt initialization
      // Don't attempt if we've already failed too many times or if we're not active
      if (isActive && !sessionInfo && isMounted && retryCount < 2) {
        try {
          updateStatus('Creating new session...');
          setInitializationFailed(false);
          
          // Create session with hardcoded avatar (using default voice)
          const avatar = 'Marianne_ProfessionalLook2_public';

          const sessionData = await newSession('low', avatar);
          if (!isMounted) return;
          
          // Reset retry count on success
          setRetryCount(0);
          
          const { sdp: serverSdp, ice_servers2: iceServers } = sessionData;
          const connection = new RTCPeerConnection({ iceServers });

          connection.ontrack = (event) => {
            if (isMounted && event.track.kind === 'audio' || event.track.kind === 'video') {
              if (mediaElementRef.current) {
                mediaElementRef.current.srcObject = event.streams[0];
              }
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

          updateStatus('Session created successfully');
          
          // Start session immediately
          updateStatus('Starting session...');
          
          if (!isMounted) return;
          
          const localDescription = await connection.createAnswer();
          await connection.setLocalDescription(localDescription);

          connection.onicecandidate = ({ candidate }) => {
            if (candidate && isMounted) {
              handleICE(sessionData.session_id, candidate.toJSON());
            }
          };

          connection.oniceconnectionstatechange = () => {
            if (isMounted) {
              updateStatus(`ICE connection state: ${connection.iceConnectionState}`);
            }
          };

          await startSession(sessionData.session_id, localDescription);

          connection.getReceivers().forEach((receiver) => {
            receiver.jitterBufferTarget = 500;
          });

          updateStatus('Avatar ready');
        } catch (error) {
          console.error('Failed to setup avatar session:', error);
          if (isMounted) {
            // Check if the error is about concurrent limits
            const errorMsg = error.message || 'Unknown error';
            const isConcurrentLimitError = errorMsg.includes('Concurrent limit reached') || 
                                         error.toString().includes('10007');
            
            // Set appropriate error message
            if (isConcurrentLimitError) {
              updateStatus(`HeyGen API limit reached. Using fallback avatar.`);
            } else {
              updateStatus(`Error initializing avatar: ${errorMsg}`);
            }
            
            // Increment retry count
            setRetryCount(prev => prev + 1);
            
            // Mark initialization as failed if this was our last retry
            if (retryCount >= 1) {
              console.log('Avatar initialization failed after maximum retries.');
              setInitializationFailed(true);
            }
            
            // Reset session state to allow retry
            setSessionInfo(null);
            setPeerConnection(null);
          }
        }
      }
    };
    
    setupSession();

    return () => {
      console.log('Avatar component unmounting, cleaning up resources...');
      isMounted = false;
      
      if (sessionInfo && sessionInfo.session_id) {
        console.log(`Closing HeyGen session with ID: ${sessionInfo.session_id}`);
        updateStatus('Closing connection...');
        
        // Store session ID in a local variable to ensure it's captured correctly
        const sessionIdToClose = sessionInfo.session_id;
        
        // First close the peer connection
        if (peerConnection) {
          try {
            console.log('Closing WebRTC peer connection...');
            peerConnection.close();
            console.log('WebRTC peer connection closed.');
          } catch (err) {
            console.error('Error closing WebRTC connection:', err);
          }
        }
        
        // Reset state to avoid any UI issues during cleanup
        setRenderID(prevID => prevID + 1);
        setMediaCanPlay(false);
        setPeerConnection(null);
        setSessionInfo(null);
        
        // Then stop the session on the server
        stopSession(sessionIdToClose)
          .then(() => {
            console.log(`HeyGen session ${sessionIdToClose} closed successfully on server`);
          })
          .catch(err => {
            console.error(`Failed to close HeyGen session ${sessionIdToClose}:`, err);
          });
      } else {
        console.log('No active HeyGen session to close');
      }
    };
  }, [isActive]);

  // Effect for handling text to speak changes
  useEffect(() => {
    if (textToSpeak && sessionInfo && sessionInfo.session_id) {
      // Only process if the text has changed and is not empty
      const trimmedText = textToSpeak.trim();
      if (trimmedText) {
        console.log('Avatar speaking:', trimmedText.substring(0, 50) + (trimmedText.length > 50 ? '...' : ''));
        updateStatus('Avatar speaking...');
        
        // Sanitize text if needed (remove special characters that might cause issues)
        const sanitizedText = trimmedText
          .replace(/[^\w\s.,!?;:()\-"']/g, '') // Keep only common punctuation and alphanumeric chars
          .substring(0, 1000); // Limit text length to avoid issues
        
        repeat(sessionInfo.session_id, sanitizedText)
          .then(() => {
            console.log('Avatar speaking completed');
            updateStatus('Avatar ready');
            
            // Clear the status display after a delay
            setTimeout(() => {
              if (status.includes('speaking')) {
                updateStatus('Avatar ready');
              }
            }, 1000);
          })
          .catch(error => {
            console.error('Avatar speaking failed:', error);
            updateStatus('Error while speaking');
          });
      }
    }
  }, [textToSpeak, sessionInfo]);

  useEffect(() => {
    const mediaElement = mediaElementRef.current;
    if (mediaElement) {
      mediaElement.onloadedmetadata = () => {
        setMediaCanPlay(true);
        
        // Try to play the video
        const playPromise = mediaElement.play();
        
        // Handle autoplay restrictions
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('Video playback started successfully');
            })
            .catch(e => {
              console.log('Autoplay prevented by browser:', e);
              
              // Add a UI element to inform the user they need to interact with the page
              const avatarDiv = mediaElement.parentElement;
              if (avatarDiv) {
                const playButton = document.createElement('button');
                playButton.textContent = 'Click to activate avatar';
                playButton.style.position = 'absolute';
                playButton.style.top = '50%';
                playButton.style.left = '50%';
                playButton.style.transform = 'translate(-50%, -50%)';
                playButton.style.padding = '10px 15px';
                playButton.style.backgroundColor = '#6366f1';
                playButton.style.color = 'white';
                playButton.style.border = 'none';
                playButton.style.borderRadius = '4px';
                playButton.style.cursor = 'pointer';
                
                playButton.onclick = () => {
                  mediaElement.play();
                  playButton.remove();
                };
                
                avatarDiv.style.position = 'relative';
                avatarDiv.appendChild(playButton);
              }
            });
        }
      };
    }
  }, [renderID]);

  // No chroma key effect or background handling

  // Derived state for UI display
  const isInitializing = !sessionInfo && isActive && !initializationFailed;
  const hasError = status.includes('Error');
  
  // If initialization has failed after retries, show a fallback UI
  if (initializationFailed && isActive) {
    return (
      <div className="Avatar-component" style={{ width: '100%', height: '100%' }}>
        <div className="avatar-container">
          <div style={{ 
            position: 'relative',
            display: 'flex', 
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            color: 'white',
            padding: '20px',
            textAlign: 'center',
            background: 'linear-gradient(135deg, #4568dc, #b06ab3)',
            borderRadius: '8px'
          }}>
            <div style={{ 
              backgroundColor: '#946cba', 
              borderRadius: '50%', 
              width: '100px', 
              height: '100px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '15px',
              fontSize: '40px'
            }}>
              AI
            </div>
            <h3 style={{ marginBottom: '10px' }}>Virtual Assistant</h3>
            <p style={{ marginBottom: '15px', opacity: 0.8, fontSize: '14px' }}>
              Video avatar is currently unavailable. <br />
              Your questions will still be answered in text.
            </p>
            {textToSpeak && (
              <div style={{ 
                padding: '15px', 
                backgroundColor: 'rgba(255,255,255,0.1)', 
                borderRadius: '8px',
                marginTop: '10px',
                maxWidth: '90%',
                wordBreak: 'break-word'
              }}>
                <p style={{ fontStyle: 'italic', fontSize: '14px' }}>"{textToSpeak.length > 100 ? textToSpeak.substring(0, 100) + '...' : textToSpeak}"</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
  
  // Normal avatar UI with video
  return (
    <div className="Avatar-component" style={{ width: '80%', height: '100%'}}>
      <div className="avatar-container">
        {/* Loading overlay */}
        <div className={`avatar-loading ${!isInitializing ? 'hidden' : ''}`}>
          <div className="avatar-spinner"></div>
          <div>Initializing Avatar...</div>
        </div>
        
        {/* Status indicator */}
        {/* <div className={`avatar-status ${hasError ? 'error' : ''} ${status.includes('speaking') ? 'visible' : ''}`}>
          {status.includes('Error') ? 'Connection Error' : (status.includes('speaking') ? 'Speaking...' : '')}
        </div> */}
        
        {/* Simple background */}
        <div 
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            // background: 'linear-gradient(135deg, #4568dc, #b06ab3)',
            borderRadius: '8px',
            zIndex: 1
          }}
        ></div>

        {/* Video element */}
        <video 
          ref={mediaElementRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            borderRadius: '8px',
            backgroundColor: 'transparent',
            position: 'relative',
            zIndex: 2
          }}
          autoPlay 
          playsInline
          muted={false}
          onError={(e) => console.error('Video error:', e)}
        ></video>
      </div>
    </div>
  );

  async function newSession(quality, avatar_name) {
    try {
      console.log('Creating new session:', { quality, avatar_name });

      // Create request body - omit the voice field entirely to use avatar's default voice
      const requestBody = {
        quality,
        avatar_name,
        // No voice field - let HeyGen use the avatar's default voice
      };

      console.log('Request payload:', JSON.stringify(requestBody));

      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.new`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Server error: ${response.status} ${response.statusText}`, 'Details:', errorText);
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      if (!data || !data.data) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure');
      }

      console.log('Session created:', data.data);
      return data.data;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async function startSession(session_id, sdp) {
    try {
      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify({ session_id, sdp }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Start session error (${response.status}): ${response.statusText}`, 'Details:', errorText);
        throw new Error(`Start session error (${response.status}): ${errorText || response.statusText}`);
      } 
      
      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  async function handleICE(session_id, candidate) {
    try {
      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.ice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify({ session_id, candidate }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`ICE error (${response.status}): ${response.statusText}`, 'Details:', errorText);
        throw new Error(`ICE error (${response.status}): ${errorText || response.statusText}`);
      } 
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
      throw error;
    }
  }

  async function repeat(session_id, text) {
    try {
      // Validate that `text` is a string
      if (typeof text !== 'string') {
        throw new Error('Invalid text input. Expected a string.');
      }

      console.log('Avatar repeating text:', text);
      
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
        throw new Error('Server error');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Error in repeat:', error);
      throw error;
    }
  }

  async function stopSession(session_id) {
    if (!session_id) {
      console.warn('Attempted to stop session with invalid session_id');
      return;
    }
    
    console.log(`Stopping HeyGen session: ${session_id}...`);
    try {
      const response = await fetch(`${heygen_API.serverUrl}/v1/streaming.stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': heygen_API.apiKey,
        },
        body: JSON.stringify({ session_id }),
      });
      
      // Even if the response is not ok, we consider the session closed since there's not much we can do
      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`Received error while stopping session (${response.status}): ${response.statusText}`, 'Details:', errorText);
        console.log('Session will be considered closed regardless of error');
        return { success: false, error: errorText };
      } 
      
      const data = await response.json();
      console.log(`Successfully stopped HeyGen session: ${session_id}`);
      return data.data;
    } catch (error) {
      console.error(`Error in stopSession for ${session_id}:`, error);
      // Even if we got an exception, we consider the session closed
      console.log('Session will be considered closed despite exception');
      return { success: false, error: error.message };
    }
  }
}

export default Avatar;