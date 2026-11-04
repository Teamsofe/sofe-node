'use client';

import React from 'react';

/**
 * Parses inline markdown:
 * - **bold** or __bold__ -> <strong>
 * - `code` -> <code>
 * - *italic* -> <em>
 * - [Source: ...] -> formatted citation badge
 */
export function renderInlineMarkdown(line, isUser = false, isLight = false) {
  if (!line) return '';

  const tokenRegex = /(\*\*([^*]+)\*\*|__([^_]+)__|`([^`]+)`|(\*([^*]+)\*)|(\[Source:[^\]]+\]))/g;
  const parts = [];
  let lastIdx = 0;
  let match;

  while ((match = tokenRegex.exec(line)) !== null) {
    if (match.index > lastIdx) {
      parts.push(line.slice(lastIdx, match.index));
    }

    const [full, , boldAsterisk, boldUnderscore, code, , italic, sourceBadge] = match;

    if (boldAsterisk || boldUnderscore) {
      const boldText = boldAsterisk || boldUnderscore;
      parts.push(
        <strong
          key={`b-${match.index}`}
          style={{
            fontWeight: 700,
            color: isUser ? '#FFFFFF' : isLight ? '#0A0F24' : '#FFFFFF',
          }}
        >
          {boldText}
        </strong>
      );
    } else if (code) {
      parts.push(
        <code
          key={`c-${match.index}`}
          style={{
            background: isUser
              ? 'rgba(255,255,255,0.22)'
              : isLight
              ? 'rgba(0,0,0,0.08)'
              : 'rgba(20,40,255,0.25)',
            border: isUser
              ? '1px solid rgba(255,255,255,0.3)'
              : '1px solid rgba(20,40,255,0.3)',
            padding: '1px 5px',
            borderRadius: '4px',
            fontFamily: 'monospace',
            fontSize: '0.88em',
            color: isUser ? '#fff' : isLight ? '#0B194F' : '#99B4FF',
          }}
        >
          {code}
        </code>
      );
    } else if (italic) {
      parts.push(
        <em key={`i-${match.index}`} style={{ fontStyle: 'italic', opacity: 0.9 }}>
          {italic}
        </em>
      );
    } else if (sourceBadge) {
      parts.push(
        <span
          key={`src-${match.index}`}
          style={{
            display: 'inline-block',
            margin: '0.2rem 0',
            padding: '0.1rem 0.45rem',
            borderRadius: '4px',
            fontSize: '0.68rem',
            fontWeight: 600,
            background: isLight ? 'rgba(255,138,0,0.12)' : 'rgba(255,138,0,0.18)',
            border: '1px solid rgba(255,138,0,0.35)',
            color: '#FF8A00',
          }}
        >
          📖 {sourceBadge.replace(/[\[\]]/g, '')}
        </span>
      );
    }

    lastIdx = tokenRegex.lastIndex;
  }

  if (lastIdx < line.length) {
    parts.push(line.slice(lastIdx));
  }

  return parts.length > 0 ? parts : line;
}

/**
 * Main Markdown content block renderer
 */
export function FormattedMarkdown({ content, isUser = false, isLight = false }) {
  if (!content) return null;

  const lines = String(content).split('\n');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
      {lines.map((line, idx) => {
        const trimmed = line.trim();

        // Empty paragraph spacing
        if (!trimmed) {
          return <div key={idx} style={{ height: '0.25rem' }} />;
        }

        // Headings: ###
        if (trimmed.startsWith('### ')) {
          return (
            <div
              key={idx}
              style={{
                fontWeight: 800,
                fontSize: '0.82rem',
                color: isUser ? '#FFFFFF' : '#FF8A00',
                marginTop: '0.4rem',
                marginBottom: '0.15rem',
                letterSpacing: '0.02em',
              }}
            >
              {renderInlineMarkdown(trimmed.replace(/^###\s+/, ''), isUser, isLight)}
            </div>
          );
        }

        // Headings: ##
        if (trimmed.startsWith('## ')) {
          return (
            <div
              key={idx}
              style={{
                fontWeight: 800,
                fontSize: '0.86rem',
                color: isUser ? '#FFFFFF' : '#FF8A00',
                marginTop: '0.5rem',
                marginBottom: '0.2rem',
                letterSpacing: '0.02em',
              }}
            >
              {renderInlineMarkdown(trimmed.replace(/^##\s+/, ''), isUser, isLight)}
            </div>
          );
        }

        // Bullets: - or * or •
        const bulletMatch = trimmed.match(/^[-*•]\s+(.*)$/);
        if (bulletMatch) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                paddingLeft: '0.35rem',
                lineHeight: 1.55,
              }}
            >
              <span
                style={{
                  color: isUser ? 'rgba(255,255,255,0.8)' : '#FF8A00',
                  lineHeight: 1.5,
                  fontSize: '0.85rem',
                  userSelect: 'none',
                }}
              >
                •
              </span>
              <div style={{ flex: 1 }}>
                {renderInlineMarkdown(bulletMatch[1], isUser, isLight)}
              </div>
            </div>
          );
        }

        // Numbered list: 1. 2.
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
        if (numMatch) {
          return (
            <div
              key={idx}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.45rem',
                paddingLeft: '0.35rem',
                lineHeight: 1.55,
              }}
            >
              <span
                style={{
                  color: isUser ? 'rgba(255,255,255,0.9)' : '#FF8A00',
                  fontWeight: 700,
                  fontSize: '0.74rem',
                  lineHeight: 1.55,
                  minWidth: '1.2rem',
                }}
              >
                {numMatch[1]}.
              </span>
              <div style={{ flex: 1 }}>
                {renderInlineMarkdown(numMatch[2], isUser, isLight)}
              </div>
            </div>
          );
        }

        // Normal paragraph
        return (
          <div key={idx} style={{ lineHeight: 1.6 }}>
            {renderInlineMarkdown(line, isUser, isLight)}
          </div>
        );
      })}
    </div>
  );
}

export default FormattedMarkdown;
