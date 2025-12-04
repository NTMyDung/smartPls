import Variable from "../../component/Variable";
import StepNavigation from "../../component/StepNavigation";

export default function PairSelector({ variables, setPairs }) {
  return (
    <div>
      <h3>Các biến từ file:</h3>
      <Variable variables={variables} />

      <h3>Tiến hành chọn các cặp biến</h3>
      <StepNavigation variables={variables} onPairsChange={setPairs} />
    </div>
  );
}
