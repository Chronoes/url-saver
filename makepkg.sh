#!/bin/sh

# Create package tarball
source ./PKGBUILD
tar -cvzf "$pkgname-$pkgver.tar.gz" app
# Get md5 of resulting file

# checksum of package
checksum=`makepkg -g`

perl -0777 -i -pe "s/md5sums=\([a-z0-9'\n]+?\)/$checksum/igs" ./PKGBUILD
# sed -i "s/md5sums=\(.*\)/$checksum/" ./PKGBUILD

# Create Arch package
makepkg -cf
