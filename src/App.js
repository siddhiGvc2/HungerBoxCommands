import { useState, useEffect, useRef } from "react";

export default function PaymentUI() {
  const [amount, setAmount] = useState("");
  const [log, setLog] = useState([]);
  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const addLog = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ----------------------------- WebSocket Connect ------------------------------
  const connectWebSocket = () => {
    const ws = new WebSocket("ws://snackboss-iot.in:3030"); // <-- your WS URL here
    wsRef.current = ws;

    ws.onopen = () => {
      addLog("✅ WebSocket Connected");
    };

    ws.onmessage = (evt) => {
      addLog("RECV ← " + evt.data);
    };

    ws.onerror = (err) => {
      addLog("❌ WebSocket Error");
    };

    ws.onclose = () => {
      addLog("🔌 WebSocket Disconnected — retrying in 3 sec...");
      setTimeout(connectWebSocket, 3000);
    };
  };

  useEffect(() => {
    connectWebSocket();

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // ----------------------------- Send Command via WebSocket ---------------------
  const sendCommand = async (cmd) => {
    addLog("SEND → " + cmd);
    wsRef.current?.send(cmd);
  };

  // ----------------------------- Handle SEND Button -----------------------------
  const handleSend = async () => {
    if (!amount) return alert("Enter Amount");

    const vendCommand = `*VEND,TID,PAYTM,${amount}00,TID#`;
    await sendCommand(vendCommand);
  };

  // ----------------------------- Poll Status Every 3 Sec ------------------------
  const startStatusPolling = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      sendCommand("*MVSTATUS?#");
    }, 3000);
  };

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 500,minWidth:400 }}>
        <h2>Payment Command UI</h2>

        <input
          type="number"
          placeholder="Enter Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          style={{
            padding: 8,
            width: "100%",
            marginBottom: 10,
            fontSize: 16,
          }}
        />

        <button
          onClick={handleSend}
          style={{
            padding: "10px 20px",
            background: "#4CAF50",
            color: "white",
            border: "none",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          SEND
        </button>

        <h3 style={{ marginTop: 20 }}>Logs</h3>
        <div
          style={{
            background: "#eee",
            padding: 10,
            height: 200,
            overflowY: "auto",
            fontSize: 14,
          }}
        >
          {log.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
