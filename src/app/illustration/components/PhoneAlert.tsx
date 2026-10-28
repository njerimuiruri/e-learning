// ============================================================
// PHONE ALERT
// ------------------------------------------------------------
// A cartoon phone that slides up, buzzes and shows an SMS.
//
//   <PhoneAlert show={true} message="⚠️ FLOOD ALERT: The river…" />
//
// show:    true = slide up and buzz; false = slide away
// message: the SMS text. Anything before the first ":" is
//          shown in bold as the heading.
// sender:  who the SMS is from
// ============================================================

interface PhoneAlertProps {
  show: boolean;
  message: string;
  sender?: string;
  className?: string;
}

export default function PhoneAlert({ show, message, sender = "Village Flood Alert", className = "" }: PhoneAlertProps) {
  const colon = message.indexOf(":");
  const heading = colon > 0 ? message.slice(0, colon) : "";
  const body = colon > 0 ? message.slice(colon + 1).trim() : message;

  return (
    <div
      className={`tm-phone ${show ? "is-shown" : ""} ${className}`}
      role={show ? "alert" : undefined}
      aria-hidden={!show}
    >
      <div className="tm-phone-notch" aria-hidden="true" />
      <div className="tm-phone-status" aria-hidden="true">
        <span>9:41 PM</span>
        <span className="tm-phone-signal">
          <i /> <i /> <i />
        </span>
      </div>
      <p className="tm-phone-from">
        <span aria-hidden="true">💬</span> {sender}
      </p>
      <div className="tm-phone-sms">
        {heading && <strong>{heading}</strong>} {body}
      </div>
      <div className="tm-phone-home" aria-hidden="true" />
    </div>
  );
}
