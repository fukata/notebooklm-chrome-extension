#!/usr/bin/env bash
# 使い方:
# ./concat_with_chapters.sh <ディレクトリ> <タイトル>
# # 例:
# ./concat_with_chapters.sh /path/to/videos "My Video Title"

# ディレクトリ 末尾のスラッシュを削除
dir=${1%/}

# タイトル
title=$2

# 引数のチェック
if [ -z "$dir" ] || [ -z "$title" ]; then
  echo "Usage: $0 <directory> <title>"
  exit 1
fi

# ディレクトリが存在するか確認
if [ ! -d "$dir" ]; then
  echo "Directory $dir does not exist."
  exit 1
fi

ruby concat_with_chapters.rb \
  --input=$dir/$title/ \
  --output=$dir/$title.mp4 \
  --title=$title \
  --chapter-titles=$dir/$title/chapter_titles.txt
