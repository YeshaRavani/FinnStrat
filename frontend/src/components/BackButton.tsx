type Props = {
  label: string;
  onClick: () => void;
};

export function BackButton({ label, onClick }: Props) {
  return <button type="button" className="secondary back-button" onClick={onClick}>← {label}</button>;
}
