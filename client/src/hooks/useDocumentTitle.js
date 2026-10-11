import { useEffect } from 'react';

const BRAND = 'Sew Lets Face It';
const DEFAULT_DESCRIPTION =
  'Sew Lets Face It - thoughtfully handmade bags and accessories by Jackie Samuels, stitched with care in the UK.';

function setMeta(name, content, attr = 'name') {
  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

export default function useDocumentTitle(title, description = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    const full = title ? `${title} | ${BRAND}` : `${BRAND} | Handmade Bags & Accessories`;
    document.title = full;
    setMeta('description', description);
    setMeta('og:title', full, 'property');
    setMeta('og:description', description, 'property');
  }, [title, description]);
}
