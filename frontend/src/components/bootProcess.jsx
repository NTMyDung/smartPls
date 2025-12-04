import { useEffect, useState } from "react";

export default function BootstrapProgress({ sessionId }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const es = new EventSource(`https://smartpls-2.onrender.com/bootstrap-progress/${sessionId}`);

    es.onmessage = (e) => {
      if (e.data === "done") {
        setProgress(100);
        es.close();
      } else {
        setProgress(Number(e.data) * 100);
      }
    };

    return () => es.close();
  }, [sessionId]);

  return (
    <div>
      <h3>Bootstrap Progress</h3>
      <progress value={progress} max="100" style={{ width: "100%" }} />
      <span>{progress.toFixed(1)}%</span>
    </div>
  );
}
