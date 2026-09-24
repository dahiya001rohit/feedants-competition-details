import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useT } from '../../i18n';
import { colors } from '../../theme';
import { Card, T } from '../ui';

const COLLAPSED_LINES = 3;

export function InfoTabs({ tabs }: { tabs: { title: string; body: string }[] }) {
  const t = useT();
  const [active, setActive] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const tab = tabs[Math.min(active, tabs.length - 1)];
  if (!tab) return null;
  const long = tab.body.split('\n').length > COLLAPSED_LINES || tab.body.length > 180;

  return (
    <Card style={{ gap: 12 }}>
      <View style={styles.tabs}>
        {tabs.map((x, i) => {
          const selected = x === tab;
          return (
            <Pressable
              key={x.title}
              onPress={() => {
                setActive(i);
                setExpanded(false);
              }}
              style={[styles.tab, selected && styles.tabActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <T
                size={12}
                w={selected ? 'semibold' : 'medium'}
                color={selected ? colors.primary : colors.textMuted}
                numberOfLines={2}
                style={{ textAlign: 'center' }}
              >
                {x.title}
              </T>
            </Pressable>
          );
        })}
      </View>
      <T size={13} color="#46525C" numberOfLines={expanded ? undefined : COLLAPSED_LINES} style={{ lineHeight: 21 }}>
        {tab.body}
      </T>
      {long && (
        <Pressable onPress={() => setExpanded((e) => !e)} style={styles.more} hitSlop={8} accessibilityRole="button">
          <T size={12} w="medium" color={colors.primary}>
            {expanded ? t.viewLess : t.viewMore}
          </T>
          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={colors.primary} />
        </Pressable>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border },
  tab: { flex: 1, flexBasis: 0, alignItems: 'center', justifyContent: 'flex-end', paddingHorizontal: 4, paddingBottom: 8 },
  tabActive: { borderBottomWidth: 2, borderBottomColor: colors.primary, marginBottom: -1 },
  more: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
});
