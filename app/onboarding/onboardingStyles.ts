import { StyleSheet, Dimensions } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';

export const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background, padding: Spacing.lg },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  stepContent: { flex: 1 },

  // Progress
  progressBar: { height: 4, backgroundColor: Colors.border, borderRadius: 2, overflow: 'hidden', marginBottom: Spacing.xs },
  progressFill: { height: '100%', backgroundColor: Colors.primary, borderRadius: 2 },
  stepCounter: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', marginBottom: Spacing.md },

  // Chester
  chesterOnboard: {
    width: 160, height: 160, borderRadius: 80, overflow: 'hidden',
    borderWidth: 4, borderColor: Colors.primary, backgroundColor: '#FFF8F0',
    marginBottom: Spacing.lg, shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8,
  },
  chesterImage: { width: '100%', height: '100%' },

  // Typography
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text, textAlign: 'center', marginBottom: Spacing.xs },
  subtitle: { fontSize: FontSize.md, color: Colors.textSecondary, textAlign: 'center', lineHeight: 24, marginBottom: Spacing.lg, paddingHorizontal: Spacing.md },
  stepEmoji: { fontSize: 48, textAlign: 'center', marginBottom: Spacing.md },
  sectionLabel: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text, marginBottom: Spacing.xs, marginTop: Spacing.md },
  sectionHint: { fontSize: FontSize.xs, color: Colors.textLight, marginBottom: Spacing.sm },

  // Inputs
  input: {
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md,
    fontSize: FontSize.md, borderWidth: 1, borderColor: Colors.border, color: Colors.text,
    marginBottom: Spacing.sm,
  },
  fieldRow: { flexDirection: 'row', gap: Spacing.sm },
  fieldHalf: { flex: 1 },
  fieldLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, marginBottom: 4 },

  // Option grid (gender)
  optionGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  optionBtn: {
    width: (width - Spacing.lg * 2 - Spacing.sm) / 2, paddingVertical: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    alignItems: 'center', borderWidth: 2, borderColor: Colors.border,
  },
  optionBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  optionIcon: { fontSize: 24, marginBottom: 4 },
  optionLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  optionLabelActive: { color: '#fff' },

  // Card options (goal, activity, cooking)
  cardOption: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.md,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 2, borderColor: Colors.border,
  },
  cardOptionActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  cardOptionIcon: { fontSize: 28 },
  cardOptionText: { flex: 1 },
  cardOptionTitle: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  cardOptionTitleActive: { color: '#fff' },
  cardOptionDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },

  // Chip grid (diet, allergies, cuisines)
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface, borderRadius: BorderRadius.full,
    borderWidth: 2, borderColor: Colors.border,
  },
  chipActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  chipActiveRed: { borderColor: Colors.error, backgroundColor: Colors.error },
  chipIcon: { fontSize: 16 },
  chipLabel: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  chipLabelActive: { color: '#fff' },

  // Number buttons
  numberRow: { flexDirection: 'row', gap: Spacing.sm },
  numberBtn: { flex: 1, paddingVertical: Spacing.sm, alignItems: 'center', backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 2, borderColor: Colors.border },
  numberBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primary },
  numberBtnText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  numberBtnTextActive: { color: '#fff' },

  // Review
  reviewCard: { backgroundColor: Colors.surface, borderRadius: BorderRadius.lg, padding: Spacing.lg, alignItems: 'center', marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border },
  reviewLabel: { fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 1 },
  reviewValue: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.primary, marginTop: 4 },
  reviewHint: { fontSize: FontSize.xs, color: Colors.textLight, marginTop: 4 },
  reviewMacros: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  reviewMacroBox: { flex: 1, alignItems: 'center', padding: Spacing.md, backgroundColor: Colors.surface, borderRadius: BorderRadius.md, borderWidth: 2 },
  reviewMacroValue: { fontSize: FontSize.lg, fontWeight: '800' },
  reviewMacroLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 2 },
  reviewSummary: { backgroundColor: Colors.surface, borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.md },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border + '40' },
  reviewRowLabel: { fontSize: FontSize.sm, color: Colors.textSecondary },
  reviewRowValue: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text },
  reviewNote: { fontSize: FontSize.xs, color: Colors.textLight, textAlign: 'center', lineHeight: 18, paddingHorizontal: Spacing.md },

  // Navigation
  navRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: Spacing.sm },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: Spacing.md },
  backBtnText: { fontSize: FontSize.md, color: Colors.textSecondary },
  nextBtn: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, backgroundColor: Colors.primary, paddingHorizontal: Spacing.xl, paddingVertical: Spacing.md, borderRadius: BorderRadius.full },
  nextBtnText: { color: '#fff', fontSize: FontSize.lg, fontWeight: '700' },
});
