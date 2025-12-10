import { useState, useEffect, useRef } from "react";

export default function PaymentUI() {
  const [amount, setAmount] = useState("");
  const [log, setLog] = useState([]);
  const intervalRef = useRef(null);

  const addLog = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  // ---- SIMULATED sendCommand function ----
  const sendCommand = async (cmd) => {
    addLog("SEND → " + cmd);

    // Simulate reply from device
    if (cmd.startsWith("*VEND")) {
      return "Amount Received";
    }
    if (cmd === "SUCCESS") {
      return "OK";
    }
    if (cmd.startsWith("*KBDK")) {
      return "KBDK-OK";
    }
    if (cmd.startsWith("*MVSTATUS?#")) {
      return "STATUS: READY";
    }
  };

  // ---- Handle SEND button ----
  const handleSend = async () => {
    if (!amount) return alert("Enter Amount");

    const vendCommand = `*VEND,TID,PAYTM,${amount}00,TID#`;
    const reply = await sendCommand(vendCommand);

    if (reply === "Amount Received") {
      const ok = await sendCommand("SUCCESS");

      if (ok === "OK") {
        await sendCommand("*KBDKTID,10,12,10,12#");

        // Start MVSTATUS polling
        startStatusPolling();
      }
    }
  };


  

  const startStatusPolling = () => {
    if (intervalRef.current) return; // prevent multiple intervals

    intervalRef.current = setInterval(async () => {
      const reply = await sendCommand("*MVSTATUS?#");
      addLog("RECV ← " + reply);
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
