import { StyleSheet, Text } from 'react-native';

import { Card } from '@/components/card';
import { Screen } from '@/components/screen';
import { Eyebrow, Muted } from '@/components/typography';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const SECTIONS: { title: string; body: string }[] = [
  {
    title: 'Vilka uppgifter vi behandlar',
    body: 'E-postadress (inloggning), visningsnamn (syns i topplistor), födelseår (endast för åldersgrupp — aldrig fullständigt födelsedatum), dagliga stegsummor, vänskaper och utmaningar, samt pushnotis-token.',
  },
  {
    title: 'Hälsodata',
    body: 'Stega läser endast antal steg — ingen puls, position eller annan hälsoinformation. Bara dagssummor lagras, aldrig rådata eller rörelsemönster. Din stegdata visas bara för dig, dina accepterade vänner och deltagare i utmaningar du gått med i. Hälsodatan säljs aldrig, delas aldrig för marknadsföring och används inte för reklam. Du kan när som helst återkalla stegbehörigheten i telefonens inställningar.',
  },
  {
    title: 'Lagring',
    body: 'Uppgifterna lagras hos Supabase i EU-region. Pushnotiser förmedlas via Expo — endast notis-token och meddelandetext, aldrig hälsodata.',
  },
  {
    title: 'Radering',
    body: 'Radera kontot och all data direkt i appen: Profil → Radera kontot och all data. Radering är permanent och omedelbar. Du kan också begära radering via johan@borjeskoncernen.se.',
  },
  {
    title: 'Dina rättigheter',
    body: 'Enligt GDPR har du rätt till tillgång, rättelse, radering och dataportabilitet, samt rätt att klaga hos Integritetsskyddsmyndigheten (IMY). Personuppgiftsansvarig: Börjesbolagen, johan@borjeskoncernen.se.',
  },
  {
    title: 'Åldersgräns',
    body: 'Stega är avsedd för användare som är 13 år eller äldre.',
  },
];

export default function IntegritetScreen() {
  const colors = useTheme();
  return (
    <Screen>
      <Muted style={styles.updated}>Senast uppdaterad 7 juli 2026</Muted>
      {SECTIONS.map((section) => (
        <Card key={section.title} style={styles.section}>
          <Eyebrow>{section.title}</Eyebrow>
          <Text style={[styles.body, { color: colors.text }]}>{section.body}</Text>
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  updated: {
    fontSize: 12,
  },
  section: {
    gap: Spacing.two,
  },
  body: {
    fontSize: 13,
    lineHeight: 19,
  },
});
