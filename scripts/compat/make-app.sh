#!/usr/bin/env bash
# Builds a minimal Angular app on a given Angular major that consumes a packed
# library tarball, with strict template and type checking.
#
# Usage:
#   scripts/compat/make-app.sh <angular-major> <typescript-range> <app-dir> <tarball> \
#     <signature_pad-range> <style> <change-detection>
#
#   style:            signals | standalone | standalone-module | module
#   change-detection: zone | zoneless
#
# Example:
#   scripts/compat/make-app.sh 22 "~6.0.0" /tmp/app-ng22 "$PWD/pkg.tgz" "^5.0.0" signals zoneless
set -euo pipefail

NG=$1; TS=$2; DIR=$3; TGZ=$4; SP=$5; STYLE=$6; ZONE=$7
PKG=$(tar -xzOf "$TGZ" package/package.json | node -p 'JSON.parse(require("fs").readFileSync(0)).name')

rm -rf "$DIR"; mkdir -p "$DIR/src"; cd "$DIR"

# --- package.json ------------------------------------------------------------
# Angular 13-15 era: rxjs 7.5 references Node types, and current @types/node
# does not compile on TypeScript 4.x, so pin it the way those projects did.
OLD_TYPES=""; OVERRIDES=""
if [ "$NG" -lt 16 ]; then
  OLD_TYPES=', "@types/node": "12.20.55"'
  OVERRIDES=', "overrides": { "@types/node": "$@types/node" }'
fi
ZONE_DEP=""
if [ "$ZONE" = zone ]; then ZONE_DEP='"zone.js": "*",'; fi
if [ "$NG" -ge 18 ]; then
  BUILDER="@angular/build:application"; BUILD_PKG='"@angular/build"'
elif [ "$NG" -ge 17 ]; then
  BUILDER="@angular-devkit/build-angular:application"; BUILD_PKG='"@angular-devkit/build-angular"'
else
  BUILDER="@angular-devkit/build-angular:browser"; BUILD_PKG='"@angular-devkit/build-angular"'
fi

cat > package.json <<EOF
{ "name": "compat-app-ng$NG", "private": true,
  "dependencies": {
    "@angular/common": "^$NG.0.0", "@angular/compiler": "^$NG.0.0", "@angular/core": "^$NG.0.0",
    "@angular/platform-browser": "^$NG.0.0", "rxjs": "^7.5.0", "tslib": "^2.3.0", $ZONE_DEP
    "signature_pad": "$SP", "$PKG": "file:$TGZ" },
  "devDependencies": { $BUILD_PKG: "^$NG.0.0", "@angular/cli": "^$NG.0.0",
    "@angular/compiler-cli": "^$NG.0.0", "typescript": "$TS" $OLD_TYPES } $OVERRIDES }
EOF

# --- angular.json / tsconfig.json -------------------------------------------
POLY="[]"
if [ "$ZONE" = zone ]; then
  if [ "$NG" -lt 15 ]; then POLY='"src/polyfills.ts"'; else POLY='["zone.js"]'; fi
fi
if [ "$NG" -ge 17 ]; then
  BUILD_OPTS='"browser": "src/main.ts", "outputPath": { "base": "dist", "browser": "" }'
  MODRES=bundler
else
  BUILD_OPTS='"main": "src/main.ts", "outputPath": "dist", "aot": true'
  MODRES=node
fi
cat > angular.json <<EOF
{ "version": 1, "cli": { "analytics": false }, "projects": { "app": { "projectType": "application", "root": "", "sourceRoot": "src",
  "architect": { "build": { "builder": "$BUILDER",
    "options": { $BUILD_OPTS, "index": "src/index.html", "tsConfig": "tsconfig.json", "polyfills": $POLY } } } } } }
EOF
FILES='"src/main.ts"'
if [ "$ZONE" = zone ] && [ "$NG" -lt 15 ]; then
  echo "import 'zone.js';" > src/polyfills.ts
  FILES='"src/main.ts", "src/polyfills.ts"'
fi
cat > tsconfig.json <<EOF
{ "compilerOptions": { "strict": true, "target": "ES2020", "module": "ES2020", "moduleResolution": "$MODRES",
  "lib": ["ES2020", "dom"], "types": [], "skipLibCheck": false, "experimentalDecorators": true, "useDefineForClassFields": false },
  "files": [$FILES], "angularCompilerOptions": { "strictTemplates": true, "strictInjectionParameters": true } }
EOF
echo '<!doctype html><html><head><base href="/"></head><body><app-root></app-root></body></html>' > src/index.html

# --- src/main.ts -------------------------------------------------------------
# The page counts strokes through both the new and the legacy outputs;
# check-app.cjs asserts on the #status text.
TEMPLATE='<signature-pad [options]="opts" [penColor]="color" [minWidth]="2"
      (beginStroke)="begin($event)" (endStroke)="end()" (onBeginEvent)="legacy($event)"></signature-pad>
    <p id="status">strokes={{ strokes }} legacy={{ legacyCount }} empty={{ empty }}</p>'
CLASS='  @ViewChild(SignaturePadComponent) pad!: SignaturePadComponent;
  opts: SignaturePadConfig = { canvasWidth: 400, canvasHeight: 200 };
  color = "blue"; strokes = 0; legacyCount = 0; empty = true;
  constructor(private cdr: ChangeDetectorRef) {}
  begin(e: SignatureStrokeEvent) { void e; }
  legacy(started: boolean) { if (started) { this.legacyCount++; } }
  end() {
    const data: PointGroup[] = this.pad.toData();
    this.strokes = data.length; this.empty = this.pad.isEmpty();
    this.pad.toDataURL("image/png"); this.cdr.markForCheck();
  }'
LIB_IMPORT="import { SignaturePadComponent, SignaturePadConfig, PointGroup, SignatureStrokeEvent, SignaturePadModule } from '$PKG';"

if [ "$STYLE" = module ]; then
  # Angular 19+ components are standalone by default.
  SA=""; if [ "$NG" -ge 19 ]; then SA="standalone: false, "; fi
  cat > src/main.ts <<EOF
import { ChangeDetectorRef, Component, NgModule, ViewChild } from '@angular/core';
import { BrowserModule, platformBrowser } from '@angular/platform-browser';
$LIB_IMPORT
@Component({ ${SA}selector: 'app-root', template: \`$TEMPLATE\` })
class AppComponent {
$CLASS
}
@NgModule({ declarations: [AppComponent], imports: [BrowserModule, SignaturePadModule], bootstrap: [AppComponent] })
class AppModule {}
platformBrowser().bootstrapModule(AppModule).catch((e) => console.error(e));
EOF
else
  if [ "$STYLE" = standalone-module ]; then STANDALONE_IMPORT=SignaturePadModule; else STANDALONE_IMPORT=SignaturePadComponent; fi
  ZL=""; PROV="[]"
  if [ "$ZONE" = zoneless ]; then
    ZL="import { provideZonelessChangeDetection } from '@angular/core';"
    PROV="[provideZonelessChangeDetection()]"
  fi
  cat > src/main.ts <<EOF
import { ChangeDetectorRef, Component, ViewChild } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
$ZL
$LIB_IMPORT
@Component({ selector: 'app-root', standalone: true, imports: [$STANDALONE_IMPORT], template: \`$TEMPLATE\` })
class AppComponent {
$CLASS
}
bootstrapApplication(AppComponent, { providers: $PROV }).catch((e) => console.error(e));
EOF
fi

# --- install and build -------------------------------------------------------
# Old Angular versions have peer ranges that newer npm may reject; fall back to legacy resolution.
npm install --no-audit --no-fund --loglevel=error >/dev/null 2>&1 \
  || npm install --no-audit --no-fund --loglevel=error --legacy-peer-deps >/dev/null
version() { node -p "JSON.parse(require('fs').readFileSync('node_modules/$1/package.json')).version"; }
echo "Angular $(version @angular/core), TypeScript $(version typescript), signature_pad $(version signature_pad), $PKG $(version "$PKG")"
NG_CLI_ANALYTICS=false npx ng build > build.log 2>&1 || { tail -40 build.log; echo "Build failed" >&2; exit 1; }
test -f dist/index.html || { tail -40 build.log; echo "Build produced no dist/index.html" >&2; exit 1; }
echo "Build ok"
