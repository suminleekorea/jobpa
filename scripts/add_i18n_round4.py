#!/usr/bin/env python3
"""Add i18n keys for Round 4 features: MyProfile, LinkedIn filter, Resume templates"""

with open('/home/ubuntu/jobpa/shared/i18n.ts', 'r') as f:
    content = f.read()

# ─── 1. Add nav.myProfile key to all 4 languages ───────────────────────────
content = content.replace(
    'moreFeatures: "기타 기능", coreFeatures: "핵심 기능",',
    'moreFeatures: "기타 기능", coreFeatures: "핵심 기능", myProfile: "내 프로필",'
)
content = content.replace(
    'moreFeatures: "More Features", coreFeatures: "Core Features",',
    'moreFeatures: "More Features", coreFeatures: "Core Features", myProfile: "My Profile",'
)
content = content.replace(
    'moreFeatures: "その他の機能", coreFeatures: "主要機能",',
    'moreFeatures: "その他の機能", coreFeatures: "主要機能", myProfile: "マイプロフィール",'
)
content = content.replace(
    'moreFeatures: "更多功能", coreFeatures: "核心功能",',
    'moreFeatures: "更多功能", coreFeatures: "核心功能", myProfile: "我的简历",'
)

# ─── 2. Add LinkedIn/MNC filter keys to jobs sections ────────────────────────

# KO jobs section - add after postedOptions
content = content.replace(
    '      postedOptions: { "24h": "24시간 이내", "3d": "3일 이내", "7d": "7일 이내", "30d": "30일 이내" },\n    },',
    '      postedOptions: { "24h": "24시간 이내", "3d": "3일 이내", "7d": "7일 이내", "30d": "30일 이내" },\n      linkedinPriority: "LinkedIn 우선", linkedinPriorityDesc: "LinkedIn 채용공고를 상단에 표시",\n      mncFriendly: "MNC/외국인 우대", mncFriendlyDesc: "MNC 및 외국인 친화적 채용공고",\n      highSalary: "고연봉", mncBadge: "MNC", foreignerFriendly: "외국인 우대",\n    },'
)

# EN jobs section
content = content.replace(
    '      postedOptions: { "24h": "Last 24 hours", "3d": "Last 3 days", "7d": "Last 7 days", "30d": "Last 30 days" },\n    },',
    '      postedOptions: { "24h": "Last 24 hours", "3d": "Last 3 days", "7d": "Last 7 days", "30d": "Last 30 days" },\n      linkedinPriority: "LinkedIn Priority", linkedinPriorityDesc: "Show LinkedIn jobs at the top",\n      mncFriendly: "MNC/Foreigner Friendly", mncFriendlyDesc: "Filter MNC and foreigner-friendly jobs",\n      highSalary: "High Salary", mncBadge: "MNC", foreignerFriendly: "Foreigner Friendly",\n    },'
)

# JA jobs section - has extra keys after postedOptions
content = content.replace(
    '      postedOptions: { "24h": "24時間以内", "3d": "3日以内", "7d": "7日以内", "30d": "30日以内" },',
    '      postedOptions: { "24h": "24時間以内", "3d": "3日以内", "7d": "7日以内", "30d": "30日以内" },\n      linkedinPriority: "LinkedIn優先", linkedinPriorityDesc: "LinkedIn求人を上位に表示",\n      mncFriendly: "MNC/外国人優遇", mncFriendlyDesc: "MNCおよび外国人歓迎の求人",\n      highSalary: "高収入", mncBadge: "MNC", foreignerFriendly: "外国人歓迎",'
)

# ZH jobs section
content = content.replace(
    '      postedOptions: { "24h": "24小时内", "3d": "3天内", "7d": "7天内", "30d": "30天内" },',
    '      postedOptions: { "24h": "24小时内", "3d": "3天内", "7d": "7天内", "30d": "30天内" },\n      linkedinPriority: "LinkedIn优先", linkedinPriorityDesc: "将LinkedIn职位显示在顶部",\n      mncFriendly: "MNC/外籍人士友好", mncFriendlyDesc: "筛选MNC及外籍人士友好职位",\n      highSalary: "高薪", mncBadge: "MNC", foreignerFriendly: "外籍友好",'
)

# ─── 3. Add resume template keys ─────────────────────────────────────────────

# KO resume section
content = content.replace(
    'retry: "다시 시도", lastAnalyzed: "마지막 분석: {date}",',
    'retry: "다시 시도", lastAnalyzed: "마지막 분석: {date}", templates: "이력서 템플릿 다운로드", templatesDesc: "전문 이력서 템플릿을 다운로드하세요", templateIntl: "국제 표준 이력서", templateIntlDesc: "글로벌 MNC 지원용 국제 표준 양식", templateKorean: "한국 사람인 자소서", templateKoreanDesc: "한국 취업 자기소개서 양식", downloadPdf: "PDF 다운로드", fillWithProfile: "프로필로 자동 채우기", templatePreview: "미리보기",'
)

# EN resume section
content = content.replace(
    'retry: "Retry", lastAnalyzed: "Last analyzed: {date}",',
    'retry: "Retry", lastAnalyzed: "Last analyzed: {date}", templates: "Resume Template Download", templatesDesc: "Download professional resume templates", templateIntl: "International Standard Resume", templateIntlDesc: "Global MNC application format", templateKorean: "Korean Saramin 자소서", templateKoreanDesc: "Korean job application cover letter format", downloadPdf: "Download PDF", fillWithProfile: "Auto-fill with Profile", templatePreview: "Preview",'
)

# JA resume section
content = content.replace(
    'retry: "再試行", lastAnalyzed: "最終分析: {date}",',
    'retry: "再試行", lastAnalyzed: "最終分析: {date}", templates: "履歴書テンプレートダウンロード", templatesDesc: "プロ仕様の履歴書テンプレートをダウンロード", templateIntl: "国際標準履歴書", templateIntlDesc: "グローバルMNC応募用フォーマット", templateKorean: "韓国サラミン자소서", templateKoreanDesc: "韓国就職用自己紹介書フォーマット", downloadPdf: "PDFダウンロード", fillWithProfile: "プロフィールで自動入力", templatePreview: "プレビュー",'
)

# ZH resume section
content = content.replace(
    'retry: "重试", lastAnalyzed: "最后分析: {date}",',
    'retry: "重试", lastAnalyzed: "最后分析: {date}", templates: "简历模板下载", templatesDesc: "下载专业简历模板", templateIntl: "国际标准简历", templateIntlDesc: "全球MNC申请格式", templateKorean: "韩国Saramin자소서", templateKoreanDesc: "韩国求职自我介绍书格式", downloadPdf: "下载PDF", fillWithProfile: "用简历自动填写", templatePreview: "预览",'
)

# ─── 4. Add myProfile section to all 4 languages ───────────────────────────
# Insert before the common section in each language

ko_profile_section = '''    myProfile: {
      title: "내 프로필",
      subtitle: "한 번 입력하면 매번 이력서 업로드 없이 AI가 개인화된 답변을 제공합니다.",
      saved: "프로필이 저장되었습니다!",
      personalInfo: "기본 정보",
      fullName: "이름",
      headline: "한 줄 소개",
      email: "이메일",
      phone: "연락처",
      location: "현재 위치",
      summary: "자기소개",
      skills: "보유 기술",
      skillsPlaceholder: "기술을 입력하고 Enter",
      experience: "경력 사항",
      addExperience: "경력 추가",
      company: "회사명",
      role: "직책",
      period: "기간 (예: 2021.03 - 2023.06)",
      description: "업무 내용",
      education: "학력",
      addEducation: "학력 추가",
      school: "학교명",
      degree: "학위",
      field: "전공",
      jobPreferences: "취업 목표",
      targetRole: "목표 직무",
      targetLocation: "목표 지역",
      targetSalary: "희망 연봉",
      visaStatus: "비자 상태",
      linkedinUrl: "LinkedIn URL",
      portfolioUrl: "포트폴리오 URL",
      noProfile: "아직 프로필이 없습니다. 지금 작성해보세요!",
      usedInFit: "이 프로필은 Job Fit 평가에 자동으로 사용됩니다.",
      usedInChat: "AI 챗봇이 이 프로필을 기반으로 개인화된 답변을 제공합니다.",
    },
    common: {
      save: "저장"'''

content = content.replace(
    '    common: {\n      save: "저장"',
    ko_profile_section
)

en_profile_section = '''    myProfile: {
      title: "My Profile",
      subtitle: "Set up once — AI will personalize all responses without requiring resume uploads.",
      saved: "Profile saved successfully!",
      personalInfo: "Personal Information",
      fullName: "Full Name",
      headline: "Professional Headline",
      email: "Email",
      phone: "Phone",
      location: "Current Location",
      summary: "Professional Summary",
      skills: "Skills",
      skillsPlaceholder: "Type a skill and press Enter",
      experience: "Work Experience",
      addExperience: "Add Experience",
      company: "Company",
      role: "Job Title",
      period: "Period (e.g. Mar 2021 - Jun 2023)",
      description: "Job Description",
      education: "Education",
      addEducation: "Add Education",
      school: "School",
      degree: "Degree",
      field: "Field of Study",
      jobPreferences: "Job Preferences",
      targetRole: "Target Role",
      targetLocation: "Target Location",
      targetSalary: "Target Salary",
      visaStatus: "Visa Status",
      linkedinUrl: "LinkedIn URL",
      portfolioUrl: "Portfolio URL",
      noProfile: "No profile yet. Set up your profile now!",
      usedInFit: "This profile is automatically used for Job Fit evaluations.",
      usedInChat: "The AI chatbot will personalize responses based on this profile.",
    },
    common: {
      save: "Save"'''

content = content.replace(
    '    common: {\n      save: "Save"',
    en_profile_section
)

ja_profile_section = '''    myProfile: {
      title: "マイプロフィール",
      subtitle: "一度設定するだけで、毎回履歴書をアップロードせずにAIが個別対応します。",
      saved: "プロフィールを保存しました！",
      personalInfo: "基本情報",
      fullName: "氏名",
      headline: "プロフェッショナルタイトル",
      email: "メールアドレス",
      phone: "電話番号",
      location: "現在地",
      summary: "自己紹介",
      skills: "スキル",
      skillsPlaceholder: "スキルを入力してEnter",
      experience: "職歴",
      addExperience: "職歴を追加",
      company: "会社名",
      role: "役職",
      period: "期間（例：2021年3月〜2023年6月）",
      description: "業務内容",
      education: "学歴",
      addEducation: "学歴を追加",
      school: "学校名",
      degree: "学位",
      field: "専攻",
      jobPreferences: "就職希望",
      targetRole: "希望職種",
      targetLocation: "希望地域",
      targetSalary: "希望年収",
      visaStatus: "ビザ状況",
      linkedinUrl: "LinkedIn URL",
      portfolioUrl: "ポートフォリオ URL",
      noProfile: "プロフィールがありません。今すぐ作成しましょう！",
      usedInFit: "このプロフィールはJob Fit評価に自動的に使用されます。",
      usedInChat: "AIチャットボットはこのプロフィールに基づいて個別対応します。",
    },
    common: {
      save: "保存"'''

# JA and ZH both have save: "保存" - need to replace only JA first
# Find the JA block by looking for the JA nav section context
# Strategy: replace first occurrence of common: { save: "保存" (that's JA)
ja_pos = content.find('    common: {\n      save: "保存"')
if ja_pos != -1:
    content = content[:ja_pos] + ja_profile_section + content[ja_pos + len('    common: {\n      save: "保存"'):]
else:
    print("WARNING: Could not find JA common anchor!")

zh_profile_section = '''    myProfile: {
      title: "我的简历",
      subtitle: "一次设置，AI将无需每次上传简历即可提供个性化回答。",
      saved: "简历保存成功！",
      personalInfo: "个人信息",
      fullName: "姓名",
      headline: "职业标题",
      email: "邮箱",
      phone: "电话",
      location: "当前位置",
      summary: "个人简介",
      skills: "技能",
      skillsPlaceholder: "输入技能后按Enter",
      experience: "工作经历",
      addExperience: "添加工作经历",
      company: "公司名称",
      role: "职位",
      period: "时间段（例：2021年3月 - 2023年6月）",
      description: "工作内容",
      education: "教育背景",
      addEducation: "添加教育背景",
      school: "学校名称",
      degree: "学位",
      field: "专业",
      jobPreferences: "求职偏好",
      targetRole: "目标职位",
      targetLocation: "目标地区",
      targetSalary: "期望薪资",
      visaStatus: "签证状态",
      linkedinUrl: "LinkedIn URL",
      portfolioUrl: "作品集 URL",
      noProfile: "暂无简历。立即创建您的简历！",
      usedInFit: "此简历将自动用于职位适配度评估。",
      usedInChat: "AI聊天机器人将根据此简历提供个性化回答。",
    },
    common: {
      save: "保存"'''

# Now replace the second occurrence (ZH)
zh_pos = content.find('    common: {\n      save: "保存"')
if zh_pos != -1:
    content = content[:zh_pos] + zh_profile_section + content[zh_pos + len('    common: {\n      save: "保存"'):]
else:
    print("WARNING: Could not find ZH common anchor!")

# ─── Verify brace depth ──────────────────────────────────────────────────────
depth = 0
for ch in content:
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
print(f"Final brace depth: {depth}")  # Must be 0

with open('/home/ubuntu/jobpa/shared/i18n.ts', 'w') as f:
    f.write(content)

print("Done! i18n keys added for Round 4 features.")
