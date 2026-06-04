import { useEffect, useMemo, useState } from 'react';
import { differenceInCalendarDays, format, addDays } from 'date-fns';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategories, useTags, useWishlistItems, useWishlistMutations } from '../hooks/useLiveQuery';
import type { WishlistItem } from '../types';
import { REMOVED_CATEGORY_IDS } from '../types';
import { formatMoney, formatDays } from '../utils/calculations';
import CategoryIcon from '../components/CategoryIcon';

type FormState = Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'imageUri'>;
type TargetMode = 'date' | 'daily';

const todayString = () => format(new Date(), 'yyyy-MM-dd');
const dateFromDays = (days: number) => format(addDays(new Date(), Math.max(0, days - 1)), 'yyyy-MM-dd');
const daysUntil = (date: string) => Math.max(1, differenceInCalendarDays(new Date(`${date}T00:00:00`), new Date()) + 1);

const emptyForm: FormState = {
  name: '',
  brand: '',
  model: '',
  categoryId: 'cat-other',
  tagIds: [],
  expectedPrice: 0,
  currency: 'CNY',
  expectedResidualValue: 0,
  targetDailyCost: 0,
  targetDate: '',
  expectedUseYears: 1,
  reason: '',
  cooldownDays: 0,
  desireLevel: 3,
  note: '',
};

export default function WishlistForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const items = useWishlistItems();
  const existing = items.find(item => item.id === id);
  const categories = useCategories().filter(cat => !REMOVED_CATEGORY_IDS.includes(cat.id));
  const tags = useTags();
  const { add, update } = useWishlistMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [targetMode, setTargetMode] = useState<TargetMode>('daily');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, status: _status, imageUri: _imageUri, ...rest } = existing;
      void _id;
      void _createdAt;
      void _updatedAt;
      void _status;
      void _imageUri;
      // Existing IndexedDB records need to be mirrored into local editable form state.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        ...rest,
        brand: '',
        model: '',
        currency: 'CNY',
        expectedResidualValue: 0,
        cooldownDays: 0,
        note: '',
        targetDate: rest.targetDate || (rest.targetDailyCost > 0 ? dateFromDays(Math.ceil(rest.expectedPrice / rest.targetDailyCost)) : ''),
      });
      setTargetMode(rest.targetDate ? 'date' : 'daily');
    }
  }, [existing]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const visibleCategory = categories.some(cat => cat.id === form.categoryId) ? form.categoryId : 'cat-other';
  const targetDays = useMemo(() => {
    if (targetMode === 'date' && form.targetDate) return daysUntil(form.targetDate);
    if (targetMode === 'daily' && form.targetDailyCost > 0) return Math.ceil(form.expectedPrice / form.targetDailyCost);
    return 0;
  }, [form.expectedPrice, form.targetDailyCost, form.targetDate, targetMode]);
  const targetDailyCost = targetMode === 'date' && targetDays > 0
    ? form.expectedPrice / targetDays
    : form.targetDailyCost;
  const targetDate = targetMode === 'daily' && targetDays > 0
    ? dateFromDays(targetDays)
    : form.targetDate;

  const handleSave = async () => {
    if (!form.name.trim() || form.expectedPrice < 0) return;
    const payload: Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt'> = {
      ...form,
      name: form.name.trim(),
      brand: '',
      model: '',
      categoryId: visibleCategory,
      currency: 'CNY',
      expectedResidualValue: 0,
      targetDailyCost: Number.isFinite(targetDailyCost) ? Number(targetDailyCost.toFixed(2)) : 0,
      targetDate: targetDate || '',
      expectedUseYears: targetDays > 0 ? Number((targetDays / 365).toFixed(2)) : 0,
      reason: '',
      cooldownDays: 0,
      note: '',
      status: existing?.status ?? 'watching',
      imageUri: null,
    };

    setSaving(true);
    try {
      if (id && existing) {
        await update(id, payload);
        navigate(`/wishlist/${id}`);
      } else {
        const newId = await add(payload);
        navigate(`/wishlist/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-3 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="text-base font-bold text-[#1D1D1F]">{id ? '编辑心愿' : '新增心愿'}</h1>
        <div className="w-10" />
      </div>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <label className="field-label">名称</label>
        <input
          placeholder="想买什么"
          value={form.name}
          onChange={e => setField('name', e.target.value)}
          className="form-input"
        />
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <div className="grid grid-cols-3 gap-2">
          <label className="field-label">
            预期价格
            <input
              type="number"
              value={form.expectedPrice || ''}
              onChange={e => setField('expectedPrice', Number(e.target.value))}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            目标日期
            <input
              type="date"
              min={todayString()}
              value={targetDate || ''}
              onFocus={() => setTargetMode('date')}
              onChange={e => {
                setTargetMode('date');
                setField('targetDate', e.target.value);
              }}
              className="form-input mt-1"
            />
          </label>
          <label className="field-label">
            日均成本
            <input
              type="number"
              value={targetDailyCost || ''}
              onFocus={() => setTargetMode('daily')}
              onChange={e => {
                setTargetMode('daily');
                setField('targetDailyCost', Number(e.target.value));
              }}
              className="form-input mt-1"
            />
          </label>
        </div>
        <div className="summary-strip">
          <div>
            <span>{targetMode === 'date' ? '反推日均' : '反推日期'}</span>
            <strong>{targetMode === 'date' ? `${formatMoney(targetDailyCost, 'CNY')}/天` : (targetDate || '-')}</strong>
          </div>
          <div>
            <span>需要冷静</span>
            <strong>{targetDays > 0 ? formatDays(targetDays) : '-'}</strong>
          </div>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-3 space-y-2.5">
        <h2 className="section-title">分类</h2>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setField('categoryId', cat.id)}
              className={`choice-chip rounded-full inline-flex items-center gap-1 ${visibleCategory === cat.id ? 'choice-chip-selected' : ''}`}
            >
              <CategoryIcon category={cat} /> {cat.name}
            </button>
          ))}
        </div>
        <h2 className="section-title pt-1">标签</h2>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => {
            const selected = form.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => setField('tagIds', selected ? form.tagIds.filter(tagId => tagId !== tag.id) : [...form.tagIds, tag.id])}
                className={`tag-chip rounded-full inline-flex items-center gap-1 ${selected ? 'tag-chip-selected' : ''}`}
              >
                <span className="tag-color-dot" />
                {tag.name}
              </button>
            );
          })}
        </div>
      </section>

      <div className="form-action-bar sticky bottom-20 z-30 -mx-1 rounded-2xl p-2 backdrop-blur">
        <button
          onClick={handleSave}
          disabled={saving || !form.name.trim()}
          className="btn-accent w-full rounded-2xl py-4 text-base disabled:opacity-40 disabled:shadow-none"
        >
          {saving ? '保存中...' : '保存心愿'}
        </button>
      </div>
    </div>
  );
}
