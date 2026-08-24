import { SURVEY_QUESTION_COUNT } from './constants';

/**
 * 회원가입 단계 사이에서 임시로 데이터를 보관한다.
 *
 * [FR-01 개편]
 *  - 삭제: gender(민감정보), position(→ 매칭/파티 생성 화면으로 이전),
 *          game / gameModes / playStyle / tier (가입 설문 밖으로 이전)
 *  - 변경: ageRange('20대') → age(숫자)
 *  - 추가: playDuration(1회 플레이 선호 분량), surveyAnswers(성향 12문항)
 *
 * surveyAnswers 는 길이 12 배열이고 미응답은 null 이다. 0 을 쓰지 않는 이유는
 * 1~5 점 척도에서 0 이 "안 했다"인지 "제일 낮다"인지 구분되지 않기 때문이다.
 */
const emptyAnswers = () => Array(SURVEY_QUESTION_COUNT).fill(null);

export const signupStore = {
  email: '',
  password: '',
  nickname: '',
  name: '',
  phone: '',
  imageFile: null,
  imagePreview: null,

  // 프로필 정보 5개
  mic: null,
  age: '',            // 숫자 문자열. 제출 직전에 Number 로 바꾼다.
  playTimes: [],      // ['저녁', '새벽']
  playDays: [],       // ['월', '수'] 또는 ['상관없음']
  playDuration: '',   // '2~4시간'

  // 성향 설문 12문항 (1~5)
  surveyAnswers: emptyAnswers(),

  riotId: '',         // 'Hide on bush#KR1' (입력 원본)
  riotGameName: '',
  riotTagLine: '',
};

export function resetSignupStore() {
  Object.assign(signupStore, {
    email: '', password: '', nickname: '', name: '', phone: '',
    imageFile: null, imagePreview: null,
    mic: null, age: '', playTimes: [], playDays: [], playDuration: '',
    surveyAnswers: emptyAnswers(),
    riotId: '', riotGameName: '', riotTagLine: '',
  });
}
