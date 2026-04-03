import { useEffect, useRef } from "react";
import type { MouseEvent, ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  className = "",
}: ModalProps) {
  const modalRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    const modalElement = modalRef.current;
    if (modalElement) {
      if (isOpen) {
        modalElement.showModal();
      } else {
        modalElement.close();
      }
    }
  }, [isOpen]);

  // 모달 외부 클릭 시 닫기
  const handleBackdropClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.currentTarget === event.target) {
      onClose();
    }
  };

  return (
    <dialog
      ref={modalRef}
      id="my_modal_1"
      className="modal"
      onClose={onClose}
      onClick={handleBackdropClick}
    >
      <div className={`modal-box ${className}`.trim()}>
        <h3 className="font-bold text-lg">{title}</h3>
        <div className="py-4">{children}</div>
        {footer ?? (
          <div className="modal-action">
            <button className="btn" onClick={onClose}>
              확인
            </button>
          </div>
        )}
      </div>
    </dialog>
  );
}

export default Modal;
