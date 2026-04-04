# 포트 열기 / 방화벽 가이드

UNICON Vote App 을 외부에서 접속하려면 서버와 클라우드 보안 설정에서 필요한 포트를 열어야 합니다.

## 기본적으로 필요한 포트

- `22` : SSH 접속
- `80` : HTTP 접속
- `443` : HTTPS 접속 (선택이지만 실운영 권장)

## 보안상 외부 공개를 권장하지 않는 포트

- `5001` : 백엔드 내부 포트
- `27017` : MongoDB 포트

즉, 보통 외부에 여는 것은 `22`, `80`, `443` 정도면 충분합니다.

## 보통 확인해야 하는 위치

1. 서버 내부 방화벽 (예: `ufw`)
2. 클라우드 보안 그룹 / 방화벽 규칙
3. 공유기 / NAT 환경이라면 포트 포워딩

## Ubuntu + ufw 예시

```bash
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
sudo ufw status
```

## 운영 기준으로 생각하면

- HTTP만 쓸 때: `80`
- HTTPS까지 쓸 때: `80`, `443`
- SSH 관리용: `22`

## 다음 단계

- [DNS 연결 가이드](./dns-setup.md)
- [univote CLI](./univote-cli.md)
- [서버 빠른 실행](./deploy-quickstart.md)
