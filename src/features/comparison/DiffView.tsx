import { ActivationSparkline } from '@/components/charts/ActivationSparkline/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';

export function DiffView() {
  return (
    <div className="space-y-4">
      <ActivationSparkline data={[0.1, 0.5, 0.9, 0.3, 0.7]} maxActivation={1} width={200} height={32} />
      <TokenHighlighter tokens={["the", "quick", "brown"]} activations={[0.5, 0.9, 0.3]} maxTokens={3} maxActivation={1} />
    </div>
  );
}