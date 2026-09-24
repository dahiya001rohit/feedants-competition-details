import { useEffect, useState } from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import type { User } from '../../api';
import { useT } from '../../i18n';
import { colors } from '../../theme';
import { PrimaryButton, T } from '../ui';

export function ReferralCard({ referral }: { referral: User['referral'] }) {
  const t = useT();
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await Clipboard.setStringAsync(referral.link);
    setCopied(true);
  };
  // Share rejects when the user dismisses it or the platform has no share sheet; nothing to do then.
  const share = () => Share.share({ message: t.shareMessage(referral.link) }).catch(() => {});

  return (
    <View style={styles.card}>
      <MaterialCommunityIcons name="bullhorn-outline" size={38} color={colors.primary} style={{ transform: [{ rotate: '-12deg' }] }} />
      <View style={{ flex: 1, gap: 8 }}>
        <T w="semibold" size={13}>
          {t.referTitle}
        </T>
        <View style={styles.linkRow}>
          <View style={styles.linkBox}>
            <T size={11} numberOfLines={1} ellipsizeMode="middle" selectable>
              {referral.link}
            </T>
          </View>
          <Pressable onPress={copy} style={styles.copy} accessibilityRole="button">
            <T size={11} w="semibold" color={colors.primary}>
              {copied ? t.copied : t.copyLink}
            </T>
          </Pressable>
        </View>
      </View>
      <View style={styles.cta}>
        <PrimaryButton compact label={t.referNow} onPress={share} />
        <T size={10} color={colors.primary} style={{ textAlign: 'center' }}>
          {t.youEarn(referral.rewardPerSignup)}
        </T>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 12,
  },
  linkRow: { flexDirection: 'row', gap: 6 },
  linkBox: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    height: 32,
  },
  copy: {
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 6,
    paddingHorizontal: 8,
  },
  cta: { width: 104, gap: 6, alignItems: 'stretch' },
});
