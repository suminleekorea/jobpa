#!/usr/bin/env python3
"""Add myProfile section to all 4 languages in i18n.ts"""

with open('/home/ubuntu/jobpa/shared/i18n.ts', 'r') as f:
    content = f.read()

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
'''

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
'''

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
'''

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
'''

# Find all 4 common: { positions
positions = []
search = '    common: {'
start = 0
while True:
    pos = content.find(search, start)
    if pos == -1:
        break
    positions.append(pos)
    start = pos + 1

print(f"Found {len(positions)} common: {{ sections at positions: {positions}")

if len(positions) == 4:
    # Insert in reverse order to preserve positions
    # ZH (4th), JA (3rd), EN (2nd), KO (1st)
    content = content[:positions[3]] + zh_profile_section + content[positions[3]:]
    content = content[:positions[2]] + ja_profile_section + content[positions[2]:]
    content = content[:positions[1]] + en_profile_section + content[positions[1]:]
    content = content[:positions[0]] + ko_profile_section + content[positions[0]:]
else:
    print(f"ERROR: Expected 4 common sections, found {len(positions)}")

# ─── Verify brace depth ──────────────────────────────────────────────────────
depth = 0
for ch in content:
    if ch == '{': depth += 1
    elif ch == '}': depth -= 1
print(f"Final brace depth: {depth}")  # Must be 0

with open('/home/ubuntu/jobpa/shared/i18n.ts', 'w') as f:
    f.write(content)

print("Done! myProfile sections added to all 4 languages.")
