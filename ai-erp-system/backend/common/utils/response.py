from rest_framework.response import Response

def success_response(data=None, message="Success"):
    return Response({
        "status": "success",
        "message": message,
        "data": data
    })

def error_response(message="Error"):
    return Response({
        "status": "error",
        "message": message
    })