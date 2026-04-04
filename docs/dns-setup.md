# DNS 연결 가이드

HTTPS로 운영하려면 **도메인**이 서버의 공개 IP를 가리켜야 합니다.

## 언제 필요한가

- `univote configure` 에서 **HTTPS 모드**를 쓸 때
- Let's Encrypt 인증서를 붙이고 싶을 때
- 실제 행사 운영 주소를 안정적으로 쓰고 싶을 때

HTTP 시험 실행만 할 거라면 DNS 없이도 가능합니다.

## 기본 개념

- 예시 도메인: `vote.example.com`
- 서버 공개 IP: `123.123.123.123`
- DNS에서 해야 할 일: `A 레코드`를 서버 IP에 연결

## 가장 단순한 설정 예시

```text
Type: A
Name: vote
Value: 123.123.123.123
TTL: 기본값
```

위처럼 설정하면 보통 `vote.example.com` 이 서버를 가리키게 됩니다.

## 체크 포인트

- 도메인이 아직 전파 중이면 HTTPS 발급이 바로 안 될 수 있음
- `80`, `443` 포트가 둘 다 열려 있어야 Let's Encrypt 검증이 잘 됨
- 서버 IP가 바뀌면 DNS도 다시 수정해야 함

## DNS가 아직 없을 때

- `univote` 메뉴의 **실험 모드로 바로 실행** 또는
- `univote configure` 의 **HTTP 모드**

로 먼저 점검할 수 있습니다.

## 다음 단계

- [포트 열기 / 방화벽 가이드](./port-opening.md)
- [서버 빠른 실행](./deploy-quickstart.md)
