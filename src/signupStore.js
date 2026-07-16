// 회원가입 3단계(정보 입력 → 설문 → 확인) 동안 임시로 데이터를 보관
export const signupStore = {
  email: '',
  password: '',
  nickname: '',
  imageFile: null,
  imagePreview: null,
  gender: '비공개',
  ageRange: '비공개',
  game: '',
  playStyle: '',
  position: '',
  mic: true,
  tier: '',
  playTimes: [],   // ['저녁', '새벽']
  gameModes: [],   // ['랭크', '칼바람']
  riotNickname: '',
};

export function resetSignupStore() {
  Object.assign(signupStore, {
    email: '', password: '', nickname: '',
    imageFile: null, imagePreview: null,
    gender: '비공개', ageRange: '비공개',
    game: '', playStyle: '', position: '', mic: true, tier: '',
    playTimes: [], gameModes: [], riotNickname: '',
  });
}
