import { useNavigate } from 'react-router-dom';

export default function About() {
  const navigate = useNavigate();

  return (
    <div className="page-safe space-y-4 pb-8">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate(-1)} className="back-button">←</button>
        <h1 className="text-lg font-bold text-[#1D1D1F]">关于</h1>
        <span className="w-8" />
      </div>
      <section className="bg-white rounded-3xl p-6 text-center">
        <div className="empty-orbit-icon mx-auto mb-4" aria-hidden="true" />
        <div className="text-2xl font-bold text-[#1D1D1F]">年轮</div>
        <div className="text-sm text-[#8E8E93] mt-2">长期资产，慢慢长出自己的时间刻度。</div>
        <div className="text-xs text-[#8E8E93] mt-2">v1.0.8</div>
      </section>
      <section className="bg-white rounded-2xl p-4 text-sm text-[#8E8E93] leading-6">
        这是一个本地优先的长期资产仪表盘 PWA。它不需要账号，不连接服务器，不上传资产、价格、备注或标签数据。所有核心数据保存在当前浏览器的 IndexedDB 中。
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
