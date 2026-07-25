interface LoadingStateProps {
  label?: string;
}

export function LoadingState({ label = 'Cargando' }: LoadingStateProps) {
  return (
    <div className="state-card" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
