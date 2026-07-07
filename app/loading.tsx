import "./loading.css";

// Instant navigation feedback: shown as the Suspense fallback the moment a
// link is clicked, while the destination page loads. Prevents the "clicked but
// nothing happens" delay in the App Router.
export default function Loading() {
  return (
    <div className="ld" role="status" aria-live="polite">
      <span className="ld__dot" />
      Loading
    </div>
  );
}
