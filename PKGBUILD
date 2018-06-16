# Maintainer: Marten Tarkin <martentarkin@gmail.com>
pkgname=url-saver
pkgver=1.2.0.0
pkgrel=1
epoch=
pkgdesc="Web Extension native app for saving URLs"
arch=('any')
url=""
license=('MIT')
groups=()
depends=('python>=3.0')
makedepends=()
checkdepends=()
optdepends=()
provides=()
conflicts=()
replaces=()
backup=()
options=()
install=
changelog=
source=("$pkgname-$pkgver.tar.gz")
noextract=()
md5sums=('be76a5140ee04d82f87eb037796ba62f')
validpgpkeys=()

package() {
	cd "$srcdir"
    DEPLOY_PATH="$pkgdir/usr/local/share/$pkgname"
    mkdir -p "$DEPLOY_PATH"
    cp -r app/* "$DEPLOY_PATH"

    # Deploy to Firefox
    mkdir -p "$pkgdir/usr/lib/mozilla/native-messaging-hosts"
    cp app/url_saver.json "$pkgdir/usr/lib/mozilla/native-messaging-hosts"
}
