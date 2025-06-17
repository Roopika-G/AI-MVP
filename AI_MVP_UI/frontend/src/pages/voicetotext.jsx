import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Topbar from "../components/top_bar";
import Sidebar from "../components/sidebar";

function VoiceToText() {
  const [recording, setRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [processedAudioURL, setProcessedAudioURL] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const navigate = useNavigate();

  const startRecording = async () => {
    setAudioURL(null);
    setProcessedAudioURL(null);
    audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new window.MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/wav" });
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        sendToBackend(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  };

  const sendToBackend = async (audioBlob) => {
    const formData = new FormData();
    formData.append("audio_file", audioBlob, "audio.wav");
    try {
      const res = await fetch("http://localhost:8000/process-audio", {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const audioBuffer = await res.arrayBuffer();
        const processedBlob = new Blob([audioBuffer], { type: "audio/wav" });
        const processedUrl = URL.createObjectURL(processedBlob);
        setProcessedAudioURL(processedUrl);
      } else {
        alert("Backend error");
      }
    } catch {
      alert("Could not reach backend");
    }
  };

  return (
    <div style={{ padding: 100 }}>
      <Topbar />
      <Sidebar />
      <div style={{marginLeft: 80, color: 'black'}}>
        <button
            className="back-arrow-btn"
            onClick={() => navigate('/applications')}
            title="Back to Home"
            style={{ marginBottom: 24 }}
        >
            &#8592; Back
        </button>
        <h1>Voice to Text (Audio Processing Demo)</h1>
        <button
            onClick={recording ? stopRecording : startRecording}
            style={{ fontSize: 18, padding: "10px 20px" }}
        >
            {recording ? "Stop Recording" : "Start Recording"}
        </button>
        <div style={{ marginTop: 30 }}>
            <h3>Original Audio:</h3>
            {audioURL && <audio src={audioURL} controls />}
        </div>
        <div style={{ marginTop: 30 }}>
            <h3>Processed Audio from Backend:</h3>
            {processedAudioURL && <audio src={processedAudioURL} controls />}
        </div>
      </div>
    </div>
  );
}

export default VoiceToText;