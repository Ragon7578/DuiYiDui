import os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)))

def write(path, content):
    full = os.path.join(BASE, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    with open(full, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  {path}")

print("Generating Contract Spirit Java backend...")

# === COMMON MODULE ===
write("common/pom.xml", """<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <parent>
        <groupId>com.contractspirit</groupId>
        <artifactId>contract-spirit</artifactId>
        <version>0.1.0</version>
    </parent>
    <modelVersion>4.0.0</modelVersion>
    <artifactId>common</artifactId>
    <packaging>jar</packaging>