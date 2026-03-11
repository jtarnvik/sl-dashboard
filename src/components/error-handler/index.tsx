import {useContext} from "react";
import {RxCross2} from "react-icons/rx";
import ErrorContext from "../../contexts/error-context.ts";

export function ErrorHandler() {
  const {error, retry, setError} = useContext(ErrorContext);

  if (!error || error.length === 0) {
    return null;
  }

  function dismiss() {
    setError("");
  }

  function retryAndDismiss() {
    retry?.();
    setError("");
  }

  return (
    <div className="flex items-center p-4 text-red-800 border-t-4 border-red-300 bg-red-50 rounded-lg"
         role="alert">
      <div className="ms-3 text-sm font-medium flex items-center gap-3">
        <span>{error}</span>
        {retry && (
          <button type="button"
                  className="underline hover:no-underline font-semibold"
                  onClick={retryAndDismiss}
          >
            Prova igen
          </button>
        )}
      </div>
      <button type="button"
              className="ms-auto -mx-1.5 -my-1.5 bg-red-50 text-red-500 rounded-lg focus:ring-2 focus:ring-red-400 p-1.5 hover:bg-red-200 inline-flex items-center justify-center h-8 w-8"
              onClick={dismiss}
      >
        <RxCross2 className="w-4 h-4" />
      </button>
    </div>
  )
}