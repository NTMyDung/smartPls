import SmartPLSDiagram from "./model";

export default function ModelDiagram({ modelResult, diagramData }) {
  if (!modelResult) return null;

  return (
    <div style={{ marginTop: "40px" }}>
      <SmartPLSDiagram data={diagramData} />
    </div>
  );
}
