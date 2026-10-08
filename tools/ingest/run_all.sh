#!/bin/bash
# Полная пересборка каталога из скачанных файлов поставщиков.
# GT_WORK — рабочая папка: by/ (файлы <id>.pdf|xlsx|pptx), ocr/ (кэш распознавания), out/ (промежуточные json).
set -e
cd "$(dirname "$0")"
rm -rf ../../images && mkdir -p ../../images
for s in atv_moto electric_cn gear_xlsx oubor_pptx minibus_quotes minibusev zuumav jiaqi gelan beiguma bike79 nicot juhool thunder jy sunsuki siekon kingche opai_m1 julong mimbob; do
  echo "== $s"; python3 $s.py 2>&1 | grep -v -i warn | head -3
done
python3 build.py
