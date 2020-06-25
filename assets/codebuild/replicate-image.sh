docker_login () {
    TYPE=$1
    DOMAIN=$2
    USERNAME=$3
    PASSWORD=$4

    echo "TYPE: $TYPE"
    echo "DOMAIN: $DOMAIN"
    echo "USERNAME: $USERNAME"

    if [ "$TYPE" == "ECR" ]; then
        USERNAME="AWS"
        AWS_REGION=`echo $DOMAIN | cut -d "." -f 4`
        echo "AWS_REGION: $AWS_REGION"
        PASSWORD=`aws ecr get-login-password --region ${AWS_REGION}`
    fi

    echo "cmd: docker login --username $USERNAME --password-stdin $DOMAIN"
    echo $PASSWORD | docker login --username $USERNAME --password-stdin $DOMAIN
}

docker_login "$SOURCE_TYPE" "$SOURCE_DOMAIN" "$SOURCE_USERNAME" "$SOURCE_PASSWORD"
docker_login "$TARGET_TYPE" "$TARGET_DOMAIN" "$TARGET_USERNAME" "$TARGET_PASSWORD"

docker pull $SOURCE_DOMAIN/$IMAGE_NAME

docker tag $SOURCE_DOMAIN/$IMAGE_NAME $TARGET_DOMAIN/$IMAGE_NAME
docker push $TARGET_DOMAIN/$IMAGE_NAME
