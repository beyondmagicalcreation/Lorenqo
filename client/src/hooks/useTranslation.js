import { useState, useCallback } from 'react';

export function useTranslation(userLanguage) {
  const [expanded, setExpanded] = useState({});

  const toggle = useCallback((msgId) => {
    setExpanded((prev) => ({ ...prev, [msgId]: !prev[msgId] }));
  }, []);

  const getPrimaryText = useCallback((msg) => {
    if (!userLanguage) return msg.content_original;
    const map = {
      nl: msg.content_nl,
      fr: msg.content_fr,
      ma: msg.content_ma_franco || msg.content_ma_arab,
    };
    return map[userLanguage] || msg.content_original;
  }, [userLanguage]);

  return { expanded, toggle, getPrimaryText };
}
