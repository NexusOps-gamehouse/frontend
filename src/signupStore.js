// 회원가입 3단계(정보 입력 → 설문 → 확인) 동안 임시로 데이터를 보관
export const signupStore = {
  email: '',
  password: '',
  nickname: '',
  name: '',
  phone: '',
  imageFile: null,
  imagePreview: null,
  gender: '비공개',
  ageRange: '비공개',
  game: '',
  playStyle: '',
  position: '',
  mic: null,
  tier: '',
  playTimes: [],   // ['저녁', '새벽']
  playDays: [],    // ['월', '수'] 또는 ['상관없음']
  gameModes: [],   // ['랭크', '칼바람']
  riotId: '',        // 'Hide on bush#KR1' (입력 원본)
  riotGameName: '',
  riotTagLine: '',
};

export function resetSignupStore() {
  Object.assign(signupStore, {
    email: '', password: '', nickname: '', name: '', phone: '',
    imageFile: null, imagePreview: null,
    gender: '비공개', ageRange: '비공개',
    game: '', playStyle: '', position: '', mic: null, tier: '',
    playTimes: [], playDays: [], gameModes: [],
    riotId: '', riotGameName: '', riotTagLine: '',
  });
}
