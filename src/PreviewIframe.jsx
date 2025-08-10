import { useRef, useEffect } from "react";

// This will re-render the iframe with new HTML content when props.html changes
const PreviewIframe = ({ html }) => {
  const iframeRef = useRef(null);

  useEffect(() => {
    if (iframeRef.current) {
      // Use srcdoc if supported (all modern browsers)
      iframeRef.current.srcdoc = html;
    }
  }, [html]);

  return (
    <iframe
        ref={iframeRef}
        style={{
            width: "100%",
            minHeight: 600,
            border: "1px solid #ccc",
            borderRadius: 4,
            marginTop: 6,
            background: "#fff"
        }}
        sandbox="allow-scripts"
        title="Agent HTML Preview"
    />

  );
};

export default PreviewIframe;
