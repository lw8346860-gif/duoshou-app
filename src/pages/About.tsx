import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="text-sm text-[#8E8E93]">← 返回</button>
        <h1 className="text-lg font-bold text-[#1D1D1F]">关于</h1>
        <span className="w-8" />
      </div>
      <section className="bg-white rounded-3xl p-6 text-center">
        <div className="mx-auto mb-4 h-14 w-14 rounded-2xl bg-[#F5F5F3] flex items-center justify-center text-xl font-black text-[#1D1D1F]">
          剁
        </div>
        <div className="text-2xl font-bold text-[#1D1D1F]">剁手</div>
        <div className="text-sm text-[#8E8E93] mt-2">买的时候冲动，以后慢慢算账。</div>
        <div className="text-xs text-[#8E8E93] mt-2">v1.0.3</div>
      </section>
      <section className="bg-white rounded-2xl p-4 text-sm text-[#8E8E93] leading-6">
        这是一个本地优先的个人消费资产管理 PWA。它不需要账号，不连接服务器，不上传资产、价格、备注或标签数据。所有核心数据保存在当前浏览器的 IndexedDB 中。
      </section>
      <section className="bg-white rounded-2xl p-4 space-y-3 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[#8E8E93]">制作人</span>
          <span className="font-semibold text-[#1D1D1F]">松壑</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#8E8E93]">修改建议联系ID</span>
          <span className="font-semibold text-[#1D1D1F]">leewiil</span>
        </div>
      </section>
    </div>
  );
}
