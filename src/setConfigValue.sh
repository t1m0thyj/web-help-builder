cwd=$(dirname "$0")
key=$1
val=$2
sed -i "s|$key:.*|$key: \"$val\"|" "$cwd/../config.yaml"
