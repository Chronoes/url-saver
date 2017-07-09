#!/bin/sh

# Create package tarball
source ./PKGBUILD
tar -cvzf "$pkgname-$pkgver.tar.gz" app
# Get md5 of resulting file
md5=`md5sum "$pkgname-$pkgver.tar.gz" | cut -d ' ' -f 1`
sed -i "s/md5sums=\(.*\)/md5sums=('$md5')/" ./PKGBUILD

# Create Arch package
makepkg -cf
