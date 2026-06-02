import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useCategories, useTags, useWishlistItems, useWishlistMutations } from '../hooks/useLiveQuery';
import type { WishlistItem } from '../types';
import CategoryIcon from '../components/CategoryIcon';

type FormState = Omit<WishlistItem, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'imageUri'>;

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
  const categories = useCategories();
  const tags = useTags();
  const { add, update } = useWishlistMutations();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existing) {
      const { id: _id, createdAt: _createdAt, updatedAt: _updatedAt, status: _status, imageUri: _imageUri, ...rest } = existing;
      void _id;
      void _createdAt;
      void _updatedAt;
      void _status;
      void _imageUri;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm(rest);
    }
  }, [existing]);

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.name.trim() || form.expectedPrice < 0 || form.targetDailyCost < 0) return;
    setSaving(true);
    try {
      if (id && existing) {
        await update(id, form);
        navigate(`/wishlist/${id}`);
      } else {
        const newId = await add({ ...form, status: 'watching', imageUri: null });
        navigate(`/wishlist/${newId}`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[#8E8E93]">← 返回</button>
        <h1 className="text-lg font-bold text-[#1D1D1F]">{id ? '编辑心愿' : '新增心愿'}</h1>
        <button onClick={handleSave} disabled={saving || !form.name.trim()} className="btn-primary px-4 py-2 rounded-xl text-sm disabled:opacity-40 disabled:shadow-none">
          {saving ? '保存中...' : '保存'}
        </button>
      </div>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <input placeholder="名称 *" value={form.name} onChange={e => setField('name', e.target.value)} className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none" />
        <div className="grid grid-cols-2 gap-2">
          <input placeholder="品牌" value={form.brand} onChange={e => setField('brand', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
          <input placeholder="型号" value={form.model} onChange={e => setField('model', e.target.value)} className="bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none" />
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <label className="text-xs text-[#8E8E93]">
            预计价格
            <input type="number" value={form.expectedPrice || ''} onChange={e => setField('expectedPrice', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
          </label>
          <label className="text-xs text-[#8E8E93]">
            预计残值
            <input type="number" value={form.expectedResidualValue || ''} onChange={e => setField('expectedResidualValue', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
          </label>
          <label className="text-xs text-[#8E8E93]">
            目标日均成本
            <input type="number" value={form.targetDailyCost || ''} onChange={e => setField('targetDailyCost', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
          </label>
          <label className="text-xs text-[#8E8E93]">
            预计使用年限
            <input type="number" value={form.expectedUseYears || ''} onChange={e => setField('expectedUseYears', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
          </label>
          <label className="text-xs text-[#8E8E93]">
            冷静期天数
            <input type="number" value={form.cooldownDays || ''} onChange={e => setField('cooldownDays', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1" />
          </label>
          <label className="text-xs text-[#8E8E93]">
            想买程度
            <select value={form.desireLevel} onChange={e => setField('desireLevel', Number(e.target.value))} className="w-full bg-[#F5F5F3] rounded-xl px-3 py-2 text-sm outline-none mt-1">
              <option value={1}>低</option>
              <option value={2}>一般</option>
              <option value={3}>想买</option>
              <option value={4}>很想买</option>
              <option value={5}>强烈想买</option>
            </select>
          </label>
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <div className="text-xs text-[#8E8E93]">分类</div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map(cat => (
            <button key={cat.id} onClick={() => setField('categoryId', cat.id)} className={`choice-chip px-3 py-1.5 rounded-full text-xs ${form.categoryId === cat.id ? 'choice-chip-selected' : ''}`}>
              <CategoryIcon category={cat} /> {cat.name}
            </button>
          ))}
        </div>
        <div className="text-xs text-[#8E8E93]">标签</div>
        <div className="flex flex-wrap gap-1.5">
          {tags.map(tag => {
            const selected = form.tagIds.includes(tag.id);
            return (
              <button
                key={tag.id}
                onClick={() => setField('tagIds', selected ? form.tagIds.filter(tagId => tagId !== tag.id) : [...form.tagIds, tag.id])}
                className={`tag-chip px-3 py-1.5 rounded-full text-xs inline-flex items-center gap-1.5 ${selected ? 'tag-chip-selected' : ''}`}
              >
                <span className="tag-color-dot" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            );
          })}
        </div>
      </section>

      <section className="bg-white rounded-2xl p-4 space-y-3">
        <textarea placeholder="购买理由" value={form.reason} onChange={e => setField('reason', e.target.value)} rows={3} className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
        <textarea placeholder="备注" value={form.note} onChange={e => setField('note', e.target.value)} rows={3} className="w-full bg-[#F5F5F3] rounded-xl px-4 py-2.5 text-sm outline-none resize-none" />
      </section>
    </div>
  );
}
