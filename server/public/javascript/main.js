$(function () {
    $('.like-post').on('click', function () {
        var $el    = $(this);
        var postId = $el.data('id');

        $.ajax({
            method: 'POST',
            url   : '/like/post/' + postId
        }).done(function (data) {
            if (data.success) {
                if (data.insert) {
                    $el.addClass('like-post--active');
                } else {
                    $el.removeClass('like-post--active');
                }
                $el.find('.like-post__count').text(data.likes);
            }
        });
    });
});
