import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current;
    dialog?.showModal();
    return () => previous?.focus();
  }, []);

  const closeFromBackdrop = (event: React.MouseEvent<HTMLDialogElement>) => {
    const dialog = ref.current;
    if (!dialog || event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside =
      event.clientX >= rect.left &&
      event.clientX <= rect.right &&
      event.clientY >= rect.top &&
      event.clientY <= rect.bottom;
    if (!inside) onClose();
  };

  return (
    <dialog ref={ref} onCancel={onClose} onClick={closeFromBackdrop}>
      <div className="modal-head">
        <div>
          <span className="eyebrow">VERDANT VAULT</span>
          <h2>{title}</h2>
        </div>
        <button className="icon-btn" aria-label="Fechar" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
