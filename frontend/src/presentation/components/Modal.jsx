export function Modal({ children, onClose }) {
  return (
    <div className="modal" onClick={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className="modal-card">{children}</div>
    </div>
  );
}
