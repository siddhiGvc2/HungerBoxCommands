import { useState, useEffect, useRef } from "react";

export default function PaymentUI() {
  const [amount, setAmount] = useState("");
  const [machineNumber, setMachineNumber] = useState("");
  const [wsUrl,setWsUrl]=useState("gvcsystems.com:3030");
  const [waitingForAmountReceived, setWaitingForAmountReceived] = useState(false);

  const [log, setLog] = useState([]);
  const [KBDKvalues,setKBDKvalues]=useState({kbd1:10,kbd2:23,kbd3:45,kbd4:67,kbd5:18});
  const KBDKvaluesRef = useRef(KBDKvalues);

  const tidRef = useRef("");
  const machineNumberRef = useRef(machineNumber);
  const waitingForAmountReceivedRef = useRef(waitingForAmountReceived);

  const wsRef = useRef(null);
  const intervalRef = useRef(null);

  const addLog = (msg) =>
    setLog((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const generateTID = () => {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit random
};


  // ----------------------------- WebSocket Connect ------------------------------
  const connectWebSocket = () => {
    const ws = new WebSocket(`ws://${wsUrl}`); // <-- your WS URL here
    wsRef.current = ws;

    ws.onopen = () => {
      addLog(`✅ WebSocket Connected ws://${wsUrl}`);
    };

    ws.onmessage = (evt) => {
    const msg = evt.data.trim();
    addLog("RECV ← " + msg);
        // --- AUTO RULE 1: When AmountReceived comes, send SUCCESS ---

        if (msg.startsWith("*") && msg.endsWith("#")) {

    const pure = msg.replace("*", "").replace("#", "");
    const parts = pure.split(",");
    
    console.log(parts);
    console.log("TID REF:", tidRef.current);
    if (parts.length === 3) {
      const recvMachine = parts[0];
      const recvTid = parts[1];
      const status = parts[2];

      console.log(typeof recvMachine, typeof machineNumberRef.current,typeof recvTid,);
      console.log("Comparing:", recvMachine == machineNumberRef.current, recvTid == tidRef.current, status == "AmountReceived");

      // CHECK if matches our machine number + TID + AmountReceived
      console.log("Waiting for AmountReceived:", waitingForAmountReceivedRef.current);
      if (
        recvMachine == machineNumberRef.current &&
        recvTid == tidRef.current && // OR recvTid === tid if you use a separate TID
        status == "AmountReceived" &&
        waitingForAmountReceivedRef.current===true

      ) {
        console.log(parts);
        waitingForAmountReceivedRef.current = false;
        // sendCommand("*SUCCESS#");
        setTimeout(()=>{
          const kbdValues = [
          KBDKvaluesRef.current.kbd1,
          KBDKvaluesRef.current.kbd2,
          KBDKvaluesRef.current.kbd3,
          KBDKvaluesRef.current.kbd4,
          KBDKvaluesRef.current.kbd5,
         
        ];

            // remove 0 or "00"
            const filteredValues = kbdValues.filter(
              (v) => Number(v) !== 0
            );

            if (filteredValues.length > 0) {
              sendCommand(
                `*KBDK${tidRef.current},${filteredValues.join(",")}#`
              );
            }

           tidRef.current = "";
        },1000)
        // reset TID after use
        // setTimeout(()=>{
        //   startStatusPolling();
        // },1000)
        return;
      }
    }
  }
  
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
  }, [wsUrl]);

  // ----------------------------- Send Command via WebSocket ---------------------
  const sendCommand = async (cmd) => {
    console.log(`HB/${machineNumberRef.current}`, cmd);
    addLog("SEND → " + cmd,);
     const message = JSON.stringify({ topic: `HB/${machineNumberRef.current}`, payload:cmd });
    wsRef.current?.send(message);
  };

  // ----------------------------- Handle SEND Button -----------------------------
  const handleSend = async () => {
    if (!amount) return alert("Enter Amount");
    const newTid = generateTID();
    tidRef.current = newTid;

    const vendCommand = `*VEND,${newTid},PAYTM,${amount}00,${newTid}#`;
    setWaitingForAmountReceived(true);
    waitingForAmountReceivedRef.current = true;
   
    await sendCommand(vendCommand);
  };

  // ----------------------------- Poll Status Every 3 Sec ------------------------
  const startStatusPolling = () => {
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      sendCommand("*MVSTATUS?#");
    }, 3000);
  };

  useEffect(()=>{
    KBDKvaluesRef.current=KBDKvalues;
  },[KBDKvalues])

  useEffect(()=>{
    waitingForAmountReceivedRef.current=waitingForAmountReceived;
  },[waitingForAmountReceived])

  useEffect(() => {
    return () => clearInterval(intervalRef.current);
  }, []);

  return (
    <div style={{width:'100%',display:'flex',justifyContent:'center'}}>
      <div style={{ padding: 20, fontFamily: "Arial", maxWidth: 500,minWidth:350 }}>
        <h2>Payment Command UI</h2>
         <h3>Choose Mqtt Websocket</h3>
        <select value={wsUrl} onChange={(e)=>setWsUrl(e.target.value)}>
            <option value={"gvcsystems.com:3030"}>GVC SYSTEMS</option>
            <option value={"snackboss-iot.in:3030"}>SNACKBOSS</option>
            <option value={"gvcsystems.com:4040"}>PROVEND</option>
        </select>
        <input
        type="text"
        placeholder="Enter Machine Number"
        onChange={(e) => machineNumberRef.current = e.target.value}
        // onChange={(e) => setMachineNumber(e.target.value)}
        style={{
          padding: 8,
          width: "100%",
          marginBottom: 10,
          fontSize: 16,
        }}
      />


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
        <div>
          <strong>KBDK Values:</strong>
          <div style={{display:'flex',gap:10,marginTop:5}}>
            <div>KBD1: <input type="number" value={KBDKvalues.kbd1} onChange={(e)=>setKBDKvalues(prev=>({...prev,kbd1:Number(e.target.value)}))} style={{width:60}}/></div>
            <div>KBD2: <input type="number" value={KBDKvalues.kbd2} onChange={(e)=>setKBDKvalues(prev=>({...prev,kbd2:Number(e.target.value)}))} style={{width:60}}/></div>
            <div>KBD3: <input type="number" value={KBDKvalues.kbd3} onChange={(e)=>setKBDKvalues(prev=>({...prev,kbd3:Number(e.target.value)}))} style={{width:60}}/></div>
            <div>KBD4: <input type="number" value={KBDKvalues.kbd4} onChange={(e)=>setKBDKvalues(prev=>({...prev,kbd4:Number(e.target.value)}))} style={{width:60}}/></div>
            <div>KBD5: <input type="number" value={KBDKvalues.kbd5} onChange={(e)=>setKBDKvalues(prev=>({...prev,kbd5:Number(e.target.value)}))} style={{width:60}}/></div>
           
            
          </div>
        </div>

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
        <button onClick={()=>setLog([])}>Clear Log</button>
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
