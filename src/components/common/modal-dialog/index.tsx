import {ReactNode} from "react";
import {Dialog, DialogBackdrop, DialogPanel, DialogTitle} from '@headlessui/react';
import {SLButton} from "../sl-button";

type Props = {
  isOpen: boolean,
  onClose: () => void,
  title: string,
  children: ReactNode,
  scrollable?: boolean,
  actions?: ReactNode,
}

export function ModalDialog({onClose, isOpen, title, children, scrollable = false, actions}: Props) {
  let scrollabelDiv1 = "fixed inset-0 flex w-screen items-center justify-center p-4";
  let scrollabelDiv2 = "";

  if (scrollable) {
    scrollabelDiv1 = "fixed inset-0 w-screen overflow-y-auto p-4";
    scrollabelDiv2 = "flex min-h-full items-center justify-center";
  }
  // No wrapper element around Dialog. Headless UI renders nothing when closed and portals when open, so a
  // wrapper would contribute an always-present empty block to whatever renders the modal — which in a flex or
  // grid parent with gaps is a phantom row and a spurious gap. The deviations pane depends on that.
  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <DialogBackdrop className="fixed inset-0 bg-black/30" />
      <div className={scrollabelDiv1}>
        <div className={scrollabelDiv2}>
          <DialogPanel className="max-w-lg space-y-4 border rounded-sm bg-white p-6">
            <DialogTitle className="font-bold">{title}</DialogTitle>
            {children}
            <div className="w-full flex justify-end gap-2">
              {actions}
              <SLButton onClick={onClose}>Stäng</SLButton>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}