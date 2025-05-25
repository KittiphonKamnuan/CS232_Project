#!/bin/bash

# สี
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🚀 CS232 - S3 Deployment Script${NC}"
echo -e "${BLUE}=================================${NC}"

# ตรวจสอบ AWS CLI
if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI ไม่พบ กรุณาติดตั้งก่อน${NC}"
    exit 1
fi

# ตรวจสอบ AWS credentials
if ! aws sts get-caller-identity > /dev/null 2>&1; then
    echo -e "${RED}❌ AWS credentials ไม่ได้ตั้งค่า${NC}"
    echo -e "${YELLOW}💡 กรุณารันคำสั่งนี้ก่อน:${NC}"
    echo -e "${YELLOW}   aws configure${NC}"
    echo -e "${YELLOW}   หรือตั้งค่า environment variables จาก AWS Lab${NC}"
    exit 1
fi

# กำหนด bucket name
BUCKET_NAME="infohub360"

echo -e "${GREEN}✅ AWS CLI configured${NC}"
echo -e "${YELLOW}📦 Target bucket: $BUCKET_NAME${NC}"

# แสดงผู้ใช้ปัจจุบัน
echo -e "${BLUE}🔍 AWS User Info:${NC}"
aws sts get-caller-identity

echo -e "${YELLOW}🚀 Starting deployment...${NC}"

# Sync ไฟล์ไป S3
aws s3 sync . s3://$BUCKET_NAME/ \
    --delete \
    --exclude ".git/*" \
    --exclude ".github/*" \
    --exclude "backend/*" \
    --exclude "node_modules/*" \
    --exclude "scripts/*" \
    --exclude "*.md" \
    --exclude "package*.json" \
    --exclude ".DS_Store"

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment สำเร็จ!${NC}"
    echo -e "${GREEN}🌐 Website URL: http://$BUCKET_NAME.s3-website-us-east-1.amazonaws.com${NC}"
    
    echo -e "${BLUE}📄 Files in bucket:${NC}"
    aws s3 ls s3://$BUCKET_NAME/ --recursive --human-readable
else
    echo -e "${RED}❌ Deployment ล้มเหลว!${NC}"
    exit 1
fi