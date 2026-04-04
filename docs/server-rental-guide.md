# 서버 빌리기 가이드

처음 운영 서버를 준비할 때 가장 먼저 결정할 것은 **어디에 띄울지** 입니다.

## 권장 기준

- 공개 IP가 있는 Linux 서버 1대
- 권장 사양: `2 vCPU / 4GB RAM / 20GB 이상 디스크`
- 권장 운영체제: `Ubuntu 22.04` 또는 `Ubuntu 24.04`
- SSH 접속 가능한 일반 사용자 계정
- `sudo` 사용 가능

## 보통 많이 쓰는 곳

- AWS Lightsail / EC2
- DigitalOcean
- Vultr
- Hetzner
- Google Cloud Compute Engine
- Naver Cloud Platform

## 처음이라면 이렇게 고르면 편합니다

- **행사용 운영 서버**: Ubuntu + 공개 IP + 고정 사양
- **짧은 시험용 서버**: 가장 저렴한 Ubuntu 인스턴스
- **실운영 예정**: 도메인 연결이 쉬운 곳 권장

## 개인 PC를 운영 서버로 비추천하는 이유

- 절전 모드나 재부팅으로 서비스가 끊길 수 있음
- 공인 IP가 바뀔 수 있음
- 외부 접속 / 방화벽 / 공유기 설정이 번거로움

## 다음 단계

서버를 빌렸다면 다음 문서를 이어서 보세요.

- [포트 열기 / 방화벽 가이드](./port-opening.md)
- [DNS 연결 가이드](./dns-setup.md)
- [univote CLI](./univote-cli.md)
