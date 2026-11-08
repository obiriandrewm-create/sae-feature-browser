import { ActivationSparkline } from '@/components/charts/ActivationSparkline/ActivationSparkline';
import { TokenHighlighter } from '@/components/charts/TokenHighlighter/TokenHighlighter';

export function OverlayView() {
  return (
    <div className="space-y-4">
      <ActivationSparkline data={[0.2, 0.6, 0.4, 0.8]} maxActivation={1} width={200} height={32} />
      <TokenHighlighter tokens={["overlay", "test"]} activations={[0.7, 0.4]} maxTokens={2} maxActivation={1} />
    </div>
  );
}