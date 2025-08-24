import React from 'react';

const AdUnit: React.FC = () => {
  React.useEffect(() => {
    try {
      // @ts-ignore
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <section className="section">
      {/* Ad Unit */}
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-9583160305658839"
        data-ad-slot="YOUR_AD_SLOT_ID"
        data-full-width-responsive="true"
      />
      <script>
        {`window.addEventListener('load', () => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) {} });`}
      </script>
    </section>
  );
};

export default AdUnit;
