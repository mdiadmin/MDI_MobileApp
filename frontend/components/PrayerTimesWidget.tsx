import React, { useRef } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, shadows } from '@/constants/theme';

const PRAYER_TIMES_URL = 'https://portal.ad-din.ca/public/mediumdisplay/542';
const WIDGET_HEIGHT = 320;

const buildInjectedCss = () => `
  * {
    box-sizing: border-box;
  }

  html, body {
    background-color: transparent !important;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif !important;
    margin: 0;
    padding: 0;
    color: ${colors.foreground} !important;
  }

  body {
    padding: 0 !important;
    margin: 0 !important;
  }

  .head-part,
  .content {
    width: 100% !important;
    max-width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
  }

  .datetime {
    display: none !important;
  }

  .head-part {
    display: none !important;
  }

  .table {
    width: 100% !important;
    background-color: ${colors.card} !important;
    border-radius: 24px !important;
    overflow: hidden !important;
    border: 1px solid rgba(27, 94, 56, 0.08) !important;
    box-shadow: 0 16px 40px rgba(27, 94, 56, 0.08) !important;
  }

  .tr {
    display: flex !important;
    align-items: center !important;
    justify-content: space-between !important;
    padding: 16px 18px !important;
    gap: 12px !important;
    border-bottom: 1px solid rgba(27, 94, 56, 0.08) !important;
    background-color: ${colors.card} !important;
  }

  .tr:last-child {
    border-bottom: none !important;
  }

  .tr:not(.trfirst) {
    background-color: rgba(232, 242, 236, 0.4) !important;
    color: #1A2E1E !important;
    font-size: 15px !important;
    font-weight: 600 !important;
  }

  .tr:not(.trfirst):nth-of-type(even) {
    background-color: #FFFFFF !important;
  }

  .tr.trfirst {
    background-color: rgba(27, 94, 56, 0.04) !important;
    padding: 14px 18px !important;
  }

  .tr.trfirst .th,
  .tr.trfirst .thfirst {
    color: #9AB5A4 !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 1px !important;
  }

  .tr.trfirst .thfirst {
    flex: 1 1 45% !important;
    text-align: left !important;
  }

  .tr.trfirst .th {
    flex: 0 0 24% !important;
    text-align: right !important;
  }

  .tr:not(.trfirst) .tdfirst {
    flex: 1 1 45% !important;
    text-align: left !important;
    display: flex !important;
    flex-direction: column !important;
    gap: 4px !important;
    padding-right: 4px !important;
    color: #1A2E1E !important;
  }

  .tr:not(.trfirst) .td,
  .tr:not(.trfirst) .tdlast {
    flex: 0 0 24% !important;
    text-align: right !important;
  }

  .tr:not(.trfirst) .td {
    color: #4A7A5E !important;
  }

  .tr:not(.trfirst) .tdlast {
    font-weight: 700 !important;
    color: #1B5E38 !important;
  }

  .tr:not(.trfirst) .smal,
  .tr:not(.trfirst) .tdfirst span,
  .tr:not(.trfirst) .tdfirst .smal {
    color: #9AB5A4 !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    line-height: 1.3 !important;
  }

  .tr:not(.trfirst) .tdfirst p {
    margin: 0 !important;
    font-size: 15px !important;
    font-weight: 700 !important;
    color: ${colors.foreground} !important;
  }

  /* Fixed Highlight Row Specificity */
  .table .tr.highlight,
  .tr.highlight:not(.trfirst) {
    background-color: #1B5E38 !important;
  }

  .tr.highlight .tdfirst p {
    color: #FFFFFF !important;
    font-weight: 700 !important;
  }
  
  .tr.highlight .td p {
    color: #FFFFFF !important;
    font-weight: 700 !important;
  }
    
  .tr.highlight .tdlast p {
    color: #C9933A !important;
    font-weight: 700 !important;
  }

  /* Hide Arabic subtitles + the "time until next prayer" caption */
  .smal:not(.tdfirst):not(.td):not(.tdlast) {
    display: none !important;
  }

  .footer,
  .footer *,
  .footer img {
    display: none !important;
  }

  .tr img,
  .th img,
  .masjid-icon,
  .masjid-icon img {
    display: none !important;
  }
`;

export default function PrayerTimesWidget() {
  const { width } = useWindowDimensions();
  const webviewRef = useRef<React.ComponentRef<typeof WebView> | null>(null);

  const injectedJs = `
    (function() {
      const existing = document.getElementById('__app_injected_style__');
      if (existing) existing.remove();
      const style = document.createElement('style');
      style.id = '__app_injected_style__';
      style.innerHTML = ${JSON.stringify(buildInjectedCss())};
      document.head.appendChild(style);
    })();
    true;
  `;

  return (
    <View style={styles.section}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Prayer Times</Text>
      </View>

      <View style={[styles.card, shadows.widget]}>
        <WebView
          ref={webviewRef}
          source={{ uri: PRAYER_TIMES_URL }}
          style={{ width: width - 32, height: WIDGET_HEIGHT, backgroundColor: colors.background ?? colors.card }}
          scrollEnabled={false}
          bounces={false}
          javaScriptEnabled
          domStorageEnabled
          injectedJavaScript={injectedJs}
          onLoadEnd={() => {
            webviewRef.current?.injectJavaScript(injectedJs);
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 16,
    marginTop: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 18,
    color: colors.primary,
    fontFamily: 'DMSerifDisplay_400Regular',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: colors.card,
  },
});